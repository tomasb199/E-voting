# E-voting

This is Blockchain-Based E-voting application.

---

### Used root technologies:

1. IBM Hyperledger Fabric (Folders - "/chaincode" and "/basic-network")
2. React (Folder - "/voting-app/client")
3. Express server (Folders - "/voting-app/server" and "/voting-app/verificationServer")

---

### Prerequisites:

1. Docker
2. Docker-Compose
3. Go
4. NodeJS and NPM
5. Python

- Hint for installation: [https://www.srcmake.com/home/fabric](https://www.srcmake.com/home/fabric)

---

### How to run application:

**0. Install NodeJS libs**

- in path "/voting-app/" run:
  ```bash
  ./installLibs.sh
  ```
  > If necessary, add script permissions. For example: "chmod 777 startVoting.sh"

**1. Run Hyperledger Fabric and register servers**

- in path: "/voting-app" run script:
  ```bash
  ./startVoting.sh
  ```
  > If necessary, add script permissions. For example: "chmod 777 startVoting.sh"

**2. Run all servers**

- in path: "/voting-app/verificationServer" run script:
  ```bash
  npm run server
  ```
- in path: "/voting-app/server" run script:
  ```bash
  npm run server
  ```
- in path: "/voting-app/client" run script:
  ```bash
  npm run start
  ```
