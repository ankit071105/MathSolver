document.getElementById('uploadForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const fileInput = document.getElementById('mathImage');
    const mathInput = document.getElementById('mathInput').value.trim();
    const formData = new FormData();

    if (fileInput.files.length > 0) {
        formData.append('mathImage', fileInput.files[0]);
    } else if (mathInput) {
        formData.append('mathText', mathInput);
    } else {
        document.getElementById('result').innerText = 'Please upload an image or enter a math problem.';
        return;
    }

    try {
        const response = await fetch('/solve', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const result = await response.json();
        document.getElementById('result').innerText = result.solution;
    } catch (error) {
        console.error('Error:', error.message);
        document.getElementById('result').innerText = 'Error solving the problem.';
    }
});
