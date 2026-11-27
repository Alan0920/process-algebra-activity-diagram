

import { parse } from "./parser.js";

const input = document.getElementById("processInput");
const button = document.getElementById("generateBtn");
const result = document.getElementById("parseResult");

button.addEventListener("click", () => {
  try {
    const ast = parse(input.value);

    result.textContent = JSON.stringify(ast, null, 2);
  } catch (error) {
    result.textContent = "解析錯誤：" + error.message;
  }
});
