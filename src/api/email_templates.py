import os


def get_invitation_template(hogar_nombre, invitation_link):

    template_path = os.path.join(os.path.dirname(
        __file__), 'templates-email', 'invitation_email.html')

    try:
        with open(template_path, 'r', encoding='utf-8') as file:
            html_content = file.read()

            html_content = html_content.replace(
                '{{hogar_nombre}}', hogar_nombre)
            html_content = html_content.replace(
                '{{invitation_link}}', invitation_link)

            return html_content

    except FileNotFoundError:
        print(f"Archivo template no encontrado en {template_path}")
        return get_fallback_template(hogar_nombre, invitation_link)
    except Exception as e:
        print(f"Error cargando template de email: {e}")
        return get_fallback_template(hogar_nombre, invitation_link)


def get_fallback_template(hogar_nombre, invitation_link):
    return f"""
    <!DOCTYPE html>
    <html>
    <body>
        <h2>¡Te han invitado a un hogar!</h2>
        <p>Has sido unvitado a unirte al hogar <strong>{hogar_nombre}</strong> en AURA</p>
        <p><ahref="{invitation_link}">Haz click para unirte</a></p>
        <p>Si el enlace no funciona, copia y pega esto en tu navegador: {invitation_link}</p>
    </body>
    </html>
    """
