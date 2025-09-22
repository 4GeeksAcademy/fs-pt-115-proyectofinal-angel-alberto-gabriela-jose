from flask import Blueprint, request, jsonify, current_app
from flask_mail import Message
from flask_jwt_extended import jwt_required, get_jwt_identity
from api.models import db, User
import os

email_bp = Blueprint('email_bp', __name__)


@email_bp.route('/send-test-email', methods=['POST'])
@jwt_required()
def send_test_email():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return jsonify({"msg": "Usuario no encontrado"}), 404

        # Crear el mensaje
        msg = Message(
            subject="¡Bienvenido a Aura! - Correo de prueba",
            recipients=[user.email],
            html=f"""
            <h1>¡Hola {user.nombre}!</h1>
            <p>Correo de prueba desde tu aplicación Aura.</p>
            <p>Tu registro se ha completado.</p>
            <br>
            <p>Saludos,<br>Aura</p>
            """
        )

        current_app.extensions['mail'].send(msg)

        return jsonify({"msg": "Correo enviado exitosamente"}), 200

    except Exception as e:
        return jsonify({"msg": f"Error al enviar el correo: {str(e)}"}), 500


@email_bp.route('/send-invitation', methods=['POST'])
@jwt_required()
def send_invitation():
    try:
        data = request.get_json()
        email = data.get('email')
        invitation_link = data.get('invitation_link')

        if not email or not invitation_link:
            return jsonify({"msg": "Email y enlace de invitación son requeridos"}), 400

        msg = Message(
            subject="¡Invitación para unirte a Aura!",
            recipients=[email],
            html=f"""
            <h1>¡Te han invitado a un hogar en Aura!</h1>
            <p>Has sido invitado a unirte a un hogar en nuestra aplicación de gestión familiar.</p>
            <p>Haz clic en el siguiente enlace para unirte:</p>
            <a href="{invitation_link}" style="
                display: inline-block;
                padding: 12px 24px;
                background-color: #1976d2;
                color: white;
                text-decoration: none;
                border-radius: 4px;
                margin: 10px 0;
            ">Unirme al hogar</a>
            <br>
            <p>Pega este enlace en tu navegador:</p>
            <p>{invitation_link}</p>
            """
        )

        current_app.extensions['mail'].send(msg)
        return jsonify({"msg": "Invitación enviada exitosamente"}), 200

    except Exception as e:
        return jsonify({"msg": f"Error al enviar la invitación: {str(e)}"}), 500
