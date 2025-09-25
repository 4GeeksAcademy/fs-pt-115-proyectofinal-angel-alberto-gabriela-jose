from flask import Blueprint, request, jsonify, current_app
from flask_mail import Message
from flask_jwt_extended import jwt_required, get_jwt_identity
from api.models import db, User
import os

email_bp = Blueprint('email_bp', __name__)


@email_bp.route('/send-invitation', methods=['POST'])
@jwt_required()
def send_invitation():
    try:
        data = request.get_json()
        email = data.get('email')
        invitation_link = data.get('invitation_link')
        hogar_nombre = data.get('hogar_nombre', 'un hogar')

        if not email or not invitation_link:
            return jsonify({"msg": "Email y enlace de invitación son requeridos"}), 400

        msg = Message(
            subject="¡Invitación para unirte a {hogar_nombre}",
            recipients=[email],
            html=f"""
            <h1>¡Te han invitado a {hogar_nombre} en Aura!</h1>
            <p>Has sido invitado a unirte al hogar <strong>{hogar_nombre}</strong> en nuestra aplicación de gestión familiar.</p>
            <br>
            <p>Pega este enlace en tu Hogar:</p>
            <p>{invitation_link}</p>
            """
        )

        current_app.extensions['mail'].send(msg)
        return jsonify({"msg": "Invitación enviada exitosamente"}), 200

    except Exception as e:
        return jsonify({"msg": f"Error al enviar la invitación: {str(e)}"}), 500
