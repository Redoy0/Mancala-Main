document.addEventListener('DOMContentLoaded', () => {
    // Tutorial navigation elements
    const prevButton = document.getElementById('prev-step');
    const nextButton = document.getElementById('next-step');
    const stepIndicator = document.getElementById('step-indicator');
    const tutorialSteps = document.querySelectorAll('.tutorial-step');
    
    let currentStep = 1;
    const totalSteps = tutorialSteps.length;
    
    // Initialize tutorial
    updateTutorialNavigation();
    
    // Add event listeners for tutorial navigation
    prevButton.addEventListener('click', () => {
        if (currentStep > 1) {
            currentStep--;
            updateTutorialNavigation();
        }
    });
    
    nextButton.addEventListener('click', () => {
        if (currentStep < totalSteps) {
            currentStep++;
            updateTutorialNavigation();
        }
    });
    
    // Function to update tutorial navigation state
    function updateTutorialNavigation() {
        // Hide all steps
        tutorialSteps.forEach(step => step.classList.remove('active'));
        
        // Show current step
        document.getElementById(`tutorial-step-${currentStep}`).classList.add('active');
        
        // Update step indicator
        stepIndicator.textContent = `Step ${currentStep} of ${totalSteps}`;
        
        // Update button states
        prevButton.disabled = (currentStep === 1);
        nextButton.disabled = (currentStep === totalSteps);
    }
});
