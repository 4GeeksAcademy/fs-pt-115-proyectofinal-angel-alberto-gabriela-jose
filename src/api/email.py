from flask_mail import Message
from flask import current_app
from . import mail


def senf_email(to, subject, template):

    try:
        msg = Message(subject,
                      recipients=[to],
                      htm=template,
                      sender=current_app.config["MAIL_DEFAULT_SENDER"]
                      )
        mail.send(msg)
        print(f"Email enviado correctamente a {to}")
        return True
    except Exception as e:
        print(f"Error enviando email: {str(e)}")
        return False
