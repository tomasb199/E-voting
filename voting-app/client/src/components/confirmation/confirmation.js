import React from "react";
import PropTypes from "prop-types";

import Modal from "react-bootstrap/Modal";
import ModalHeader from "react-bootstrap/ModalHeader";
import ModalFooter from "react-bootstrap/ModalFooter";
import Button from "react-bootstrap/Button";
import { confirmable, createConfirmation } from "react-confirm";

class Confirmation extends React.Component {
  render() {
    const {
      proceedLabel,
      cancelLabel,
      title,
      confirmation,
      show,
      proceed,
      dismiss,
      cancel,
      enableEscape = true
    } = this.props;
    return (
      <div className="static-modal">
        <Modal
          show={show}
          onHide={dismiss}
          backdrop={enableEscape ? true : "static"}
          keyboard={enableEscape}
        >
          <ModalHeader>
            <Modal.Title>{title}</Modal.Title>
          </ModalHeader>
          <Modal.Body>{confirmation}</Modal.Body>
          <ModalFooter>
            <Button variant="danger" onClick={cancel}>{cancelLabel}</Button>
            <Button variant="success" onClick={proceed}>
              {proceedLabel}
            </Button>
          </ModalFooter>
        </Modal>
      </div>
    );
  }
}

Confirmation.propTypes = {
  okLabbel: PropTypes.string,
  cancelLabel: PropTypes.string,
  title: PropTypes.string,
  confirmation: PropTypes.string,
  show: PropTypes.bool,
  proceed: PropTypes.func, // called when ok button is clicked.
  cancel: PropTypes.func, // called when cancel button is clicked.
  dismiss: PropTypes.func, // called when backdrop is clicked or escaped.
  enableEscape: PropTypes.bool
};

export function confirm(
  confirmation,
  proceedLabel = "OK",
  cancelLabel = "Back",
  title = "Test",
  options = {}
) {
  return createConfirmation(confirmable(Confirmation))({
    confirmation,
    proceedLabel,
    cancelLabel,
    title,
    ...options
  });
}