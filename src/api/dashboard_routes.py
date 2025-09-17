from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from api.models import db, User, Hogar, Task, Reward, ShoppingItem, Goal
from sqlalchemy import func, desc, label

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard_data():
    try:
        user_id = get_jwt_identity()
        current_user = User.query.get(user_id)

        if not current_user or not current_user.casa_id:
            user_data = current_user.serialize() if current_user else None
            return jsonify({"user": user_data, "hogar": None}), 200

        hogar = Hogar.query.get(current_user.casa_id)
        historial_recompensas = db.session.query(Reward).filter(
            Reward.casa_id == current_user.casa_id,
            Reward.canjeado_por.isnot(None)
        ).order_by(desc(Reward.created_at)).limit(5).all()

        historial_formateado = [
            {
                "id": recompensa.id,
                "recompensa_titulo": recompensa.title,
                "usuario_nombre": recompensa.canjeador.nombre if recompensa.canjeador else "Desconocido",
                "fecha": recompensa.created_at.strftime("%d de %b, %Y")
            }
            for recompensa in historial_recompensas
        ]

        tareas_completas = Task.query.filter_by(casa_id=current_user.casa_id, asignado_a=user_id, estado="completa").count()
        tareas_pendientes = Task.query.filter_by(casa_id=current_user.casa_id, asignado_a=user_id, estado="pendiente").count()
        ranking = User.query.filter_by(casa_id=current_user.casa_id).order_by(desc(User.puntos)).limit(5).all()

        return jsonify({
            "user": current_user.serialize(),
            "hogar": hogar.serialize(),
            "stats": {
                "puntos": current_user.puntos,
                "tareas_completas": tareas_completas,
                "tareas_pendientes": tareas_pendientes,
            },
            "ranking": [{"nombre": user.nombre, "puntos": user.puntos} for user in ranking],
            "historial_recompensas": historial_formateado
        }), 200

    except Exception as e:
        return jsonify({"msg": f"Error al obtener datos del dashboard: {str(e)}"}), 500
