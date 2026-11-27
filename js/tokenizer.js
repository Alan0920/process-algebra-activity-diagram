
const KEYWORDS = [
  "seq", "strict", "alt", "par",
  "ref", "raise", "fork", "join",
  "pseudo", "entry", "exit", "do"
];

const SYMBOLS = ["0", "◉", "C", "©"];

export function tokenize(input) {
  const tokens = [];
  let i = 0;
  let line = 1;
  let column = 1;

  function addToken(type, value, startLine, startColumn) {
    tokens.push({
      type,
      value,
      line: startLine,
      column: startColumn
    });
  }

  while (i < input.length) {
    const ch = input[i];

    // 忽略空白
    if (/\s/.test(ch)) {
      if (ch === "\n") {
        line++;
        column = 1;
      } else {
        column++;
      }
      i++;
      continue;
    }

    const startLine = line;
    const startColumn = column;

    // 處理 >>
    if (input.startsWith(">>", i)) {
      addToken("OPERATOR", ">>", line, column);
      i += 2;
      column += 2;
      continue;
    }

    // 處理字串，例如 "hello"
    if (ch === '"') {
      i++;
      column++;

      let value = "";

      while (i < input.length && input[i] !== '"') {
        if (input[i] === "\n") {
          throw new Error(
            `字串不能跨行：第 ${line} 行`
          );
        }

        if (input[i] === "\\" && i + 1 < input.length) {
          i++;
          column++;
        }

        value += input[i];
        i++;
        column++;
      }

      if (i >= input.length) {
        throw new Error(
          `第 ${startLine} 行：字串缺少結尾引號`
        );
      }

      i++;
      column++;

      addToken("STRING", value, startLine, startColumn);
      continue;
    }

    // 處理標點符號
    if ("[].(),:.".includes(ch)) {
      addToken("PUNCTUATION", ch, line, column);
      i++;
      column++;
      continue;
    }

    // 處理特殊符號 0、◉、©
    if (ch === "0" || ch === "◉" || ch === "©") {
      addToken("SYMBOL", ch, line, column);
      i++;
      column++;
      continue;
    }

    // 處理識別字，例如 i1、i2
    if (/[a-zA-Z_]/.test(ch)) {
      let value = "";

      while (
        i < input.length &&
        /[a-zA-Z0-9_]/.test(input[i])
      ) {
        value += input[i];
        i++;
        column++;
      }

      if (KEYWORDS.includes(value)) {
        addToken("KEYWORD", value, startLine, startColumn);
      } else if (SYMBOLS.includes(value)) {
        addToken("SYMBOL", value, startLine, startColumn);
      } else {
        addToken("IDENTIFIER", value, startLine, startColumn);
      }

      continue;
    }

    throw new Error(
      `無法辨識的字元「${ch}」，位置：第 ${line} 行、第 ${column} 欄`
    );
  }

  tokens.push({
    type: "EOF",
    value: null,
    line,
    column
  });

  return tokens;
}
