from api.email_templates import get_invitation_template
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from api.resend_service import send_email
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

        html_template = get_invitation_template(hogar_nombre, invitation_link)

        success = send_email(
            to=email,
            subject="¡Invitación para unirte a {hogar_nombre} en AURA!",
            template=html_template
        )

        if success:
            return jsonify({"msg": "Invitación enviada con éxito"}), 200
        else:
            return jsonify({"msg": "Error al enviar invitación"}), 500

    except Exception as e:
        return jsonify({"msg": f"Error al enviar la invitación {str(e)}"}), 500
