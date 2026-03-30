const { JSDOM } = require("jsdom");
const dom = new JSDOM(`<!DOCTYPE html><p>Hello world</p>`);
try {
  dom.window.document.querySelector('#');
} catch(e) {
  console.log(e.name, e.message);
}
