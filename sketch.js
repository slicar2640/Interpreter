var variables = {};
var code;
var pixArr = [];
var tagsArr = {};
var screenResolution = 1

function preload() {
  code = (loadStrings("programs/pong.txt"))
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  preRun(code)
}

function draw() {
  background(0);
  variables.mouseX = constrain(floor(mouseX / screenResolution), 0, floor(width / screenResolution) - 1)
  variables.mouseY = constrain(floor(mouseY / screenResolution), 0, floor(height / screenResolution) - 1)

  parse(code);
  for (let x = 0; x < width / screenResolution; x++) {
    for (let y = 0; y < height / screenResolution; y++) {
      let index = (x + y * width / screenResolution) * 3
      let col = pixArr.slice(index, index + 3)
      fill(col)
      noStroke()
      rect(x * screenResolution, y * screenResolution, screenResolution);
    }
  }
}

function parse(code) {
  let instArr;
  if (typeof code == "string") {
    instArr = code.split('\n');
  } else {
    instArr = code;
  }

  try {
    for (let ip = 0; ip < instArr.length; ip++) {
      let instruction = instArr[ip];
      let split = instruction.split(" ")
      let command = split[0];

      if (command == "start") {
        if (frameCount > 1) {
          continue
        }
        split.shift()
        command = split[0]
        instruction = instruction.substring(6)
      }

      if (command == "onclick") {
        if (!mouseIsPressed) {
          continue
        }
        split.shift()
        command = split[0]
        instruction = instruction.substring(6)
      }

      if (command == "") {
        continue;
      } else if (command.startsWith("//")) {
        continue;
      } else if (command == "res") {
        let res = value(split[1]);
        screenResolution = res;
        reRes(screenResolution)
      } else if (command == "size") {
        let sizeX = value(split[1]);
        let sizeY = value(split[2]);
        resizeCanvas(sizeX, sizeY);
        background(0)
      } else if (command == "print") {
        let msg = evaluate(instruction.substring(6));
        console.log(msg);
      } else if (command == "var") {
        let variable = split[1].substring(1);
        let val = evaluate(instruction.match(/=\s.*/)[0].substring(2));
        variables[variable] = val;
      } else if (command == "set") {
        let index = floor(value(split[1]))
        let val = evaluate(split.slice(2).join(" "))
        pixArr[index] = val
      } else if (command == "get") {
        let idx = floor(value(split[1]))
        let variable = split[2].substring(1)
        let val = pixArr[idx]
        variables[variable] = val
      } else if (command == "halt") {
        noLoop();
        break;
      } else if (command == "goto") {
        if (split.includes("if")) {
          let ifIndex = instruction.indexOf("if")
          let condition = instruction.substring(ifIndex + 3)
          let isTrue = evaluate(condition) === true
          if (isTrue) {
            ip = value(split[1]) - 1
          }
        } else {
          ip = value(split[1]) - 1
          continue;
        }
      } else if (command == "clear") {
        pixArr = new Array(floor(width / screenResolution) * floor(height / screenResolution) * 3).fill(0)
      } else if (command.startsWith("@")) {
        continue;
      } else if (command.startsWith("$")) {
        variables[command.substring(1)] = evaluate(split.slice(2).join(' '))
      } else {
        noLoop();
        throw new Error("Unknown command: " + command);
      }
    }
  } catch (error) {
    console.log(error);
  }

}

function value(s) {
  if (s.startsWith("$")) {
    return variables[s.substring(1)];
  } else if (s.startsWith("@")) {
    return tagsArr[s.substring(1)];
  } else if (s.startsWith("'") || s.startsWith('"')) {
    return s.substring(1, s.length - 1);
  } else if (s.startsWith("(")) {
    return evaluate(s.substring(1, s.length - 1))
  } else if (s == "true") {
    return true
  } else if (s == "false") {
    return false
  } else if (/^.*\(/.test(s)) {
    let func = s.match(/.*\(/)[0]
    func = func.substring(0, func.length - 1)
    let param = s.match(/\(.*\)/)[0]
    param = param.substring(1, param.length - 1)
    switch (func) {
      case "floor":
        return floor(evaluate(param))
      case "ceil":
        return ceil(evaluate(param))
      case "round":
        return round(evaluate(param))
      case "random":
        return random(evaluate(param))
      case "sin":
        return sin(evaluate(param))
      case "cos":
        return cos(evaluate(param))
      case "tan":
        return tan(evaluate(param))
      case "abs": 
        return abs(evaluate(param))
    }
  } else {
    if (s.includes(".")) {
      return parseFloat(s);
    }
    return parseInt(s)
  }
}

function evaluate(s) {
  const operationTypes = ["+", "-", "*", "/", "%", "^", "<", ">"]
  const doubleOperationTypes = ["==", "!=", "<=", ">=", "||", "&&"]
  let parenthDepth = 0
  let operation, opIdx
  let doubleOperator = false
  for (let i = 0; i < s.length; i++) {
    if (s[i] == "(") parenthDepth++
    if (s[i] == ")") parenthDepth--

    if(doubleOperationTypes.includes(s.slice(i, i + 2))) {
      if (parenthDepth == 0) {
        operation = s.slice(i, i + 2)
        opIdx = i
        doubleOperator = true
      }
    } else if (operationTypes.includes(s[i])) {
      if (s[i + 1] == " ") {
        if (parenthDepth == 0) {
          operation = s[i]
          opIdx = i
        }
      }
    }
  }
  if (operation == undefined) {
    return value(s)
  }
  let first = s.substring(0, opIdx - 1).trim()
  let last = s.substring(opIdx + 2 + doubleOperator).trim()

  // if (first.startsWith("(")) {
  //   first = evaluate(first.substring(1, first.length - 1))
  // }
  // if (last.startsWith("(")) {
  //   last = evaluate(last.substring(1, last.length - 1))
  // }

  // console.log(first, operation, last)

  switch (operation) {
    case "+":
      return value(first.toString()) + value(last.toString())

    case "-":
      return value(first.toString()) - value(last.toString())

    case "*":
      return value(first.toString()) * value(last.toString())

    case "/":
      return value(first.toString()) / value(last.toString())

    case "%":
      return value(first.toString()) % value(last.toString())

    case "^":
      return pow(value(first.toString()), value(last.toString()))

    case "==":
      return value(first.toString()) == value(last.toString())

    case "!=":
      return value(first.toString()) != value(last.toString())

    case "<=":
      return value(first.toString()) <= value(last.toString())

    case ">=":
      return value(first.toString()) >= value(last.toString())

    case "<":
      return value(first.toString()) < value(last.toString())

    case ">":
      return value(first.toString()) > value(last.toString())

    case "||":
      return value(first.toString()) || value(last.toString())

    case "&&":
      return value(first.toString()) && value(last.toString())
  }
}

function reRes(res) {
  pixArr = new Array(floor(width / res) * floor(height / res) * 3).fill(0);
}

function preRun(code) {
  let instArr;
  if (typeof code == "string") {
    instArr = code.split('\n');
  } else {
    instArr = code;
  }
  for (let ip = 0; ip < instArr.length; ip++) {
    let instruction = instArr[ip];
    let split = instruction.split(" ")
    let command = split[0];

    if (command.startsWith("@")) {
      let pos = command.substring(1);
      tagsArr[pos] = ip;
    }
  }
}