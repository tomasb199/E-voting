package com.example.demo.controller;

import com.example.demo.model.AfterSignParams;
import org.apache.axis2.AxisFault;
import org.apache.axis2.context.ConfigurationContext;
import org.apache.axis2.context.ConfigurationContextFactory;
import org.apache.commons.io.IOUtils;
import org.hyperledger.fabric.gateway.*;
import org.springframework.web.bind.annotation.*;
import sk.disig.qessigner.*;
import sk.disig.qessigner.clients.DocumentManagerClient;
import sk.disig.qessigner.clients.QESSignerClient;
import sk.disig.qessigner.clients.QESSignerException;
import sk.disig.qessigner.clients.RestContentServiceClient;

import java.io.*;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.concurrent.TimeoutException;
import java.security.cert.*;

@RequestMapping("/voting-app")
@RestController
public class HelloController {

    public ConfigurationContext cc = ConfigurationContextFactory.createConfigurationContextFromFileSystem(null, "axis2.xml");
    public QESSignerClient qesSignerClient = new QESSignerClient(cc, "http://websigner.disig.sk/Products/QESSigner/4.6.x_Demo_ce0687120884423d/QESSigner.svc");
    public DocumentManagerClient documentManagerClient = new DocumentManagerClient(cc, "http://websigner.disig.sk/Products/QESSigner/4.6.x_Demo_ce0687120884423d/DocumentManager.svc");
    public RestContentServiceClient restContentServiceClient = new RestContentServiceClient(cc, "http://websigner.disig.sk/Products/QESSigner/4.6.x_Demo_ce0687120884423d/RestContentService.svc");

    public HelloController() throws QESSignerException, AxisFault {
    }

    //Endpoint for test whether signing function is available
    @CrossOrigin(origins = "http://localhost:3000")
    @PostMapping("/hello")
    public String hello(@RequestBody String input){
        System.out.println(input);
        return input;
    }

    @CrossOrigin(origins = "http://localhost:3000")
    @PostMapping("/sendVote")
    public String sendVote(@RequestBody String vote) throws IOException, QESSignerException, TimeoutException, InterruptedException {

        String fileToSign = "vote.txt";
        String language = "sk"; // "sk" or "en";

        System.out.println("Hlas: " + vote);

        // Data z konfiguracie
        Boolean isEidas = true; // Mod EIdAS/SK ZEP
        String qesPortalBaseUrl = "https://websigner.disig.sk/Products/QESPortal/2.5.x_Demo_00e866427a1943ab/QESPortal/"; // URL QES Portalu
        String returnUrl = "http://localhost:3000/AfterSign?productId=45&sessionId=@(sessionId)&documentId=@(signedDocumentId)&status=@(status)"; // Adresa z placeholdermi, na ktoru ma byt pouzivatel presmerovany po podpisani dokumentu.

        ResponseParams responseParams = new ResponseParams();
        responseParams.setNonce(null);
        responseParams.setEnvelopeFormat(EnvelopeFormat.OnlyResponseData);
        responseParams.setAddProvingData(false);
        responseParams.setDocumentOutputFormat(DocumentOutputFormat.OnlyData);

        // Vytvorenie novej session
        SessionCreateEnvelope sessionCreateEnvelope = qesSignerClient.sessionCreate(responseParams);
        String sessionId = sessionCreateEnvelope.getData().getSessionId();
        // Vytvorenie noveho dokumentu v QES Signerovi
        String documentId = documentManagerClient.createSessionDocument(sessionId, fileToSign, null, null);

        // Upload obsahu dokumentu do QES Signera
        restContentServiceClient.setSessionDocumentContent(documentId, sessionId, IOUtils.toInputStream(vote));

        // Vytvorenie URL ne presmerovanie do QES Portalu
        String redirectUrl = qesPortalBaseUrl
                + language
                + "/Qes/Sign?"
                + "sessionId=" + URLEncoder.encode(sessionId, StandardCharsets.UTF_8)
                + "&documentId=" + URLEncoder.encode(documentId, StandardCharsets.UTF_8)
                + "&isEidas=" + (isEidas ? "true" : "false")
                // + "&signatureType=" + signatureType //signature types: "Cades", "Pades", "Xades",...
                + "&retUrl=" + URLEncoder.encode(returnUrl, StandardCharsets.UTF_8);

        return redirectUrl;
    }

    @CrossOrigin(origins = "http://localhost:3000")
    @PostMapping("/afterSign")
    public String afterSign(@RequestBody AfterSignParams afterSignParams) throws IOException, QESSignerException, InterruptedException, TimeoutException, CertificateException {

        String blockchainResponse = "";

        String sessionId = afterSignParams.getSessionId();
        String documentId = afterSignParams.getDocumentId();
        System.out.println("SessionId: " + sessionId + "\nDocumentId: " + documentId);

        //Najskor zistim, ci dokument existuje
        if(documentManagerClient.sessionDocumentExists(sessionId, documentId)) {

            ResponseParams defaultResponseParams = new ResponseParams();
            defaultResponseParams.setAddProvingData(false);
            defaultResponseParams.setDocumentOutputFormat(DocumentOutputFormat.DocIdAndData);
            defaultResponseParams.setEnvelopeFormat(EnvelopeFormat.ResponseAndSignatureData);
            defaultResponseParams.setNonce(null);

            Document document = new Document();
            document.setDocId(documentId);

            SignedDocument signedDocument = new SignedDocument();
            signedDocument.setDocument(document);

            ValidateEnvelope validateEnvelope = qesSignerClient.eidasValidate(sessionId, signedDocument, null, null, null, defaultResponseParams);

            ArrayOfValidationResponse validationResponses = validateEnvelope.getData().getValidationResponses();

            //Ziskaj podpisane data
            String doc = validationResponses.getValidationResponse()[0].getOriginalDocument().getDocId();
            InputStream is = restContentServiceClient.getSessionDocumentContent(doc, sessionId);
            StringWriter writer = new StringWriter();
            String encoding = StandardCharsets.UTF_8.name();
            IOUtils.copy(is, writer, encoding);
            String votingData = writer.toString();
            System.out.println(votingData);

            //Ziskaj certifikat
            ValidationResponse[] validationResponses1 = validationResponses.getValidationResponse();
            Document finalDocument = validationResponses1[0].getSignatures().getESSignatureValidationDetail()[0].getAdESSignatureValidationDetail().getSignature().getSigningCertificate();
            String documentID = finalDocument.getDocId();//Certifikat //TODO: Ziskat podpis nie certifikat
            InputStream inputStream = restContentServiceClient.getSessionDocumentContent(documentID, sessionId);
            CertificateFactory cf = CertificateFactory.getInstance("X.509");
            X509Certificate certificate = (X509Certificate) cf.generateCertificate(inputStream);

            //Ziskaj informacie o podpise
            ValidationResultType validationResultType = validationResponses1[0].getSignatures().getESSignatureValidationDetail()[0].getAdESSignatureValidationDetail().getOverallValidationResult().getType();
            validationResultType.equals(ValidationResultType.VALID);

            if (validationResultType.equals(ValidationResultType.VALID)) {
                String virtualId = mapSignIdToVirtualId(certificate); //Parameter bude certifikat
                blockchainResponse = invokeChaincode(votingData, virtualId);
                blockchainResponse = virtualId;
            } else {
                blockchainResponse = "false";
            }

            // Zavretie session
            qesSignerClient.sessionDestroy(sessionId, defaultResponseParams);
        }
        else{
            blockchainResponse = "false";
        }

        return blockchainResponse;
    }

    //TODO: Dokoncit mapovanie
    public static String mapSignIdToVirtualId(Certificate cert){

        String virtualId = "1";

        return virtualId;
    }

    public static String invokeChaincode(String data, String id) throws IOException, TimeoutException, InterruptedException {

        String res = "";

        Path walletDirectory = Paths.get("wallet");
        Wallet wallet = Wallet.createFileSystemWallet(walletDirectory);
        // Path to a common connection profile describing the network.
        Path networkConfigFile = Paths.get("connection.json");

        // Configure the gateway connection used to access the network.
        Gateway.Builder builder = Gateway.createBuilder()
                .identity(wallet, "admin")
                .networkConfig(networkConfigFile);

        // Create a gateway connection
        try (Gateway gateway = builder.connect()) {
            // Obtain a smart contract deployed on the network.
            Network network = gateway.getNetwork("mychannel");
            Contract contract = network.getContract("fabcar");

            // Submit transactions that store state to the ledger.
            byte[] send = contract.createTransaction("createVoteWithSign")
                    .submit(data, id);
            res = new String(send, StandardCharsets.UTF_8);
            System.out.println(res);
            return res;

        } catch (ContractException e) {
            System.out.println(e);
            e.printStackTrace();
        }
        return res;
    }

}
