import React from 'react';
import {func} from 'prop-types';
const PapaParse = require('papaparse/papaparse.min.js');

const FileRead = ({
    accept = '.csv, text/csv',
    onFileLoaded,
    onError,
    parserOptions = {}
}) => {

  const handleChangeFile = e => {
    let reader = new FileReader();
    if (e.target.files.length > 0) {
      const filename = e.target.files[0].name;

      reader.onload = event => {
        const csvData = PapaParse.parse(
          event.target.result,
          Object.assign(parserOptions, {
            error: onError
          })
        );
        onFileLoaded(csvData.data, filename);
      };

      reader.readAsText(e.target.files[0]);
    }
  };
        return(
            <form>
                <div className="custom-file">
                    <input type="file" className="custom-file-input" id="customFile" onChange={e => handleChangeFile(e)} accept={accept}/>
                    <label className="custom-file-label" htmlFor="customFile">Choose file</label>
                </div>
            </form>
        );
    };
    FileRead.propTypes = {
        onFileLoaded: func.isRequired,
        onError: func,
    };

export default FileRead;