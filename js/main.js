
const generateBtn = document.getElementById("generateBtn");
const processInput = document.getElementById("processInput");

generateBtn.addEventListener("click", () => {
    const input = processInput.value;

    console.log("Process Algebra:", input);

    alert("Input received: " + input);
});
