export function csvToArray(data, delimiter = '\r\n') {
  console.log(data);
  return data.split(delimiter)
}
