import React, {Component} from "react";

import Modal from "react-bootstrap/Modal";
import ModalFooter from "react-bootstrap/ModalFooter";
import { ClipLoader } from 'react-spinners';

class Spinner extends Component {
    render() {

        const mystyle = {
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            };

        const {
          show = true,
          dismiss,
          enableEscape = false
        } = this.props;
        return (
          <div className="static-modal">
            <Modal
              show={show}
              onHide={dismiss}
              backdrop={enableEscape ? true : "static"}
              keyboard={enableEscape}
              
            >
            <Modal.Header 
            style={{
                backgroundColor: '#36d7B7',
                padding: '1px'
            }}
            />
            <Modal.Body 
            style={{display: 'flex',
                    justifyContent:'center',
                    alignItems:'center',
                    height: '25vh',
                    backgroundColor: '#ecf0f5'
            }}>
            <ClipLoader
            css={mystyle}
            sizeUnit={"px"}
            size={150}
            color={'#36d7B7'}
            />
            </Modal.Body>
            <ModalFooter
            style={{
                backgroundColor: '#36d7B7',
                padding: '1px'
            }}
            />
           </Modal>
          </div>
        );
      }
}
export default Spinner;
