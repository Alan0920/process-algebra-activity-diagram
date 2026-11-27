
import { tokenize } from "./tokenizer.js";

export function parse(input) {
  const tokens = tokenize(input);
  let index = 0;

  function peek() {
    return tokens[index];
  }

  function consume() {
    return tokens[index++];
  }

  function error(message) {
    const token = peek();

    throw new Error(
      `第 ${token.line} 行、第 ${token.column} 欄：${message}`
    );
  }

  function parseItem() {
    const token = peek();

    if (token.type === "IDENTIFIER") {
      consume();

      return {
        type: "interaction",
        name: token.value
      };
    }

    if (token.type === "SYMBOL") {
      consume();

      return {
        type: "symbol",
        value: token.value
      };
    }

    error(`目前不支援這個語法項目：${token.value ?? "輸入結尾"}`);
  }

  const items = [];
  const operators = [];

  // 讀取第一個項目
  if (peek().type === "EOF") {
    error("輸入內容不能是空的");
  }

  items.push(parseItem());

  // 讀取後續項目
  while (peek().type !== "EOF") {
    const operator = peek();

    if (
      operator.value !== "." &&
      operator.value !== ">>"
    ) {
      error("目前只支援 . 和 >> 順序連接符號");
    }

    operators.push(consume().value);

    if (peek().type === "EOF") {
      error("連接符號後面缺少項目");
    }

    items.push(parseItem());
  }

  return {
    type: "sequence",
    items,
    operators
  };
}
