const hasProperty = (obj, key) => Object.hasOwnProperty.call(obj, key);

const successResponse = (response, contentType, page) => {
  response.writeHead(200, { 'Content-Type': contentType });
  response.write(page);
  return response.end();
};

const errCodes = [
    { name: 'ENOENT', value: 404 },
];

const checkErr = (err, response, cases = errCodes) => {
  if (err) {
    cases.some((errCode) => {
      const codeMatched = err.code === errCode.name;
      if (codeMatched) { response.writeHead(errCode.value); }
      return codeMatched;
    });
    return response.end(err);
  }
  return null;
};

module.exports.hasProperty = hasProperty;
module.exports.successResponse = successResponse;
module.exports.checkErr = checkErr;
