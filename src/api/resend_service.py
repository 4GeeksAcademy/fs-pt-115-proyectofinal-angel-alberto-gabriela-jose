import os
import resend
from flask import current_app


def init_resend():

    api_key = os.getenv('RESEND_API_KEY')
    if not api_key:
        raise ValueError("RESEND_API_KEY no está configurada")
    resend.api_key = api_key


def send_email(to, subject, template):

    try:
        init_resend()

        params = {
            "from": "AURA <onboarding@resend.dev>",
            "to": [to],
            "subject": subject,
            "html": template
        }

        response = resend.Emails.send(params)
        print(f"Email enviado correctamente a {to}. ID: {response['id']}")
        return True

    except Exception as e:
        print(f"Error enviando email con Resend: {str(e)}")
        return False
