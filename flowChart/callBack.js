
function sum (num1, num2) {
    return num1 + num2;
}

function assignFunction (callBack) {
    let num1 = Number(prompt('insert number one'));
    let num2 = Number(prompt('insert number 2'));
    return callBack(num1, num2)
}

let result = assignFunction(sum);
console.log(result)