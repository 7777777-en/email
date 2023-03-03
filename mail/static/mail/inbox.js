document.addEventListener('DOMContentLoaded', function () {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // Handle Submit
  document.querySelector('#compose-form').addEventListener('submit', send_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#detail-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}


// Open email details by id
function view_email(id) {
  fetch(`/emails/${id}`)
    .then(response => response.json())
    .then(email => {

      // Show only the detail view and hide others 
      document.querySelector('#emails-view').style.display = 'none';
      document.querySelector('#compose-view').style.display = 'none';
      document.querySelector('#detail-view').style.display = 'block';

      // Populate with the required content
      document.querySelector('#detail-view').innerHTML = ` 
        <ul class="list-group list-group-flush">
        <li class="list-group-item">From: ${email.sender} | <small>${email.timestamp}</small></li>
        <li class="list-group-item">To: ${email.recipients}</li>
        <li class="list-group-item">Subject: ${email.subject}</li>
        <li class="list-group-item"><p>${email.body}</p></li>
      </ul > `

      // Check if the email is read or not
      if (!email.read) {
        fetch(`/emails/${email.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            read: true
          })
        })
      }


      // Create button for Archived or Unarchived
      const archived_btn = document.createElement('button');
      archived_btn.innerHTML = email.archived ? "Unarchive" : "Archive";
      archived_btn.className = email.archived ? "btn btn-primary" : "btn btn-primary";

      // Set to archive or unarchived 
      archived_btn.addEventListener('click', function () {
        fetch(`/emails/${email.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            archived: !email.archived
          })
        })
          // Redirect to the archive page
          .then(() => { load_mailbox('archive') })
      });
      document.querySelector('#detail-view').append(archived_btn);


      // Create button for Reply
      const reply_btn = document.createElement('button');
      reply_btn.innerHTML = "Reply";
      reply_btn.className = "btn btn-secondary";

      // Redirect to the compose_email 
      reply_btn.addEventListener('click', function () {
        compose_email();

        // Prefill the values of the fileds
        document.querySelector('#compose-recipients').value = email.sender;
        // Check if Re: exists or not and set it to the subject
        let subject = email.subject;
        if (subject.split(' ', 1)[0] != "Re:") {
          subject = "Re: " + email.subject;
        }
        document.querySelector('#compose-subject').value = subject;
        document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.timestamp} wrote: ${email.body}`;
      });
      document.querySelector('#detail-view').append(reply_btn);
    });
}


function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#detail-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Get emails
  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {

      // Loop through each email
      emails.forEach(email => {

        // Create div container for each email
        const viewEmail = document.createElement('div');
        viewEmail.className = "card";

        // Fill with email content
        viewEmail.innerHTML = `
        <div class="card-body">
        <div class="card-title">
        From: ${email.sender} | <small>${email.timestamp}</small>
        </div>
        <div class="card-text">Subject: ${email.subject}</div>
        </div>
        <hr>`;

        // Check background color
        viewEmail.className = email.read ? "read" : "unread";

        // Event Listener to view email details
        viewEmail.addEventListener('click', function () {
          view_email(email.id)
        });
        document.querySelector('#emails-view').append(viewEmail);
      })
    });

}

function send_email() {
  // Store the values
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  // Send data to back-end
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body
    })
  })
    .then(response => response.json())
    .then(result => {
      // Print result
      console.log(result);
      load_mailbox('sent');
    });
}
