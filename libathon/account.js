// Function to handle updating personal information
document.querySelector('form').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent the default form submission

    // Get the values from the form fields
    const email = document.querySelector('input[type="email"]').value;
    const phone = document.querySelector('input[type="tel"]').value;

    // Simulate an update process (you can replace this with an actual API call)
    alert(`Personal information updated:\nEmail: ${email}\nPhone: ${phone}`);
});

// Function to handle changing the password
document.querySelectorAll('.card-body form')[1].addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent the default form submission

    // Get the values from the password fields
    const currentPassword = document.querySelector('input[type="password"]').value;
    const newPassword = document.querySelectorAll('input[type="password"]')[1].value;
    const confirmPassword = document.querySelectorAll('input[type="password"]')[2].value;

    // Check if new password and confirm password match
    if (newPassword !== confirmPassword) {
        alert("New password and confirmation do not match.");
        return;
    }

    // Simulate a password change process (you can replace this with an actual API call)
    alert("Password changed successfully!");
});

// Function to handle notification preferences
document.querySelector('.notification-preferences form').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent the default form submission

    // Get the values of the notification checkboxes
    const emailNotifications = document.querySelector('input[type="checkbox"]:nth-child(1)').checked;
    const smsNotifications = document.querySelector('input[type="checkbox"]:nth-child(2)').checked;

    // Simulate saving preferences (you can replace this with an actual API call)
    alert(`Notification preferences updated:\nEmail Notifications: ${emailNotifications}\nSMS Notifications: ${smsNotifications}`);
});