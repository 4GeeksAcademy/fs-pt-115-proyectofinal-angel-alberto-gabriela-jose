from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from api.models import db, User, Reward, Hogar

recompensas_bp = Blueprint('recompensas_bp', __name__)


@recompensas_bp.route('/recompensas', methods=['POST'])
@jwt_required()
def create_reward():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user or not user.casa_id:
            return jsonify({"msg": "Debes pertenecer a un hogar para crear recompensas"}), 400

        data = request.get_json()
        title = data.get('titulo')
        description = data.get('descripcion')
        costo = data.get('costo')
        emoji = data.get('emoji', '')

        if not all([title, description, costo]):
            return jsonify({"msg": "Título, descripción y costo son requeridos"}), 400

        new_reward = Reward(
            title=title,
            description=description,
            costo_puntos=int(costo),
            emoji=emoji,
            casa_id=user.casa_id
        )
        db.session.add(new_reward)
        db.session.commit()

        return jsonify(new_reward.serialize()), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": f"Error al crear recompensa: {str(e)}"}), 500


@recompensas_bp.route('/recompensas/<int:reward_id>', methods=['DELETE'])
@jwt_required()
def delete_reward(reward_id):
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        reward = Reward.query.get(reward_id)

        if not reward:
            return jsonify({"msg": "Recompensa no encontrada"}), 404

        if reward.casa_id != user.casa_id:
            return jsonify({"msg": "No tienes permiso para eliminar esta recompensa"}), 403

        db.session.delete(reward)
        db.session.commit()

        return jsonify({"msg": "Recompensa eliminada exitosamente"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": f"Error al eliminar recompensa: {str(e)}"}), 500


@recompensas_bp.route('/recompensas/hogar', methods=['GET'])
@jwt_required()
def get_rewards():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user or not user.casa_id:
            return jsonify({"msg": "Debes pertenecer a un hogar"}), 400

        recompensas = Reward.query.filter_by(casa_id=user.casa_id).all()
        return jsonify([reward.serialize() for reward in recompensas]), 200

    except Exception as e:
        return jsonify({"msg": f"Error al obtener recompensas: {str(e)}"}), 500


@recompensas_bp.route('/recompensas/canjear/<int:reward_id>', methods=['POST'])
@jwt_required()
def redeem_reward(reward_id):
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        reward = Reward.query.get(reward_id)

        if not user:
            return jsonify({"msg": "Usuario no encontrado"}), 404

        if not reward:
            return jsonify({"msg": "Recompensa no encontrada"}), 404

        if reward.casa_id != user.casa_id:
            return jsonify({"msg": "Recompensa no disponible en tu hogar"}), 403

        if user.puntos < reward.costo_puntos:
            return jsonify({"msg": "No tienes suficientes puntos"}), 400

        if reward.canjeado_por is not None:
            return jsonify({"msg": "Esta recompensa ya ha sido canjeada"}), 400

        # Actualizar puntos y marcar como canjeada
        user.puntos -= reward.costo_puntos
        reward.canjeado_por = user_id

        db.session.commit()

        return jsonify({
            "msg": "Recompensa canjeada exitosamente",
            "puntos_restantes": user.puntos,
            "recompensa": reward.serialize()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": f"Error al canjear recompensa: {str(e)}"}), 500


@recompensas_bp.route('/recompensas/historial', methods=['GET'])
@jwt_required()
def get_reward_history():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user or not user.casa_id:
            return jsonify({"msg": "Debes pertenecer a un hogar"}), 400

        # Obtener recompensas canjeadas del hogar
        recompensas_canjeadas = Reward.query.filter(
            Reward.casa_id == user.casa_id,
            Reward.canjeado_por.isnot(None)
        ).all()

        historial = []
        for reward in recompensas_canjeadas:
            usuario = User.query.get(reward.canjeado_por)
            historial.append({
                "id": reward.id,
                "titulo": reward.title,
                "descripcion": reward.description,
                "costo": reward.costo_puntos,
                "emoji": reward.emoji,
                "usuario": usuario.nombre if usuario else "Usuario desconocido",
                "usuario_id": reward.canjeado_por
            })

        return jsonify(historial), 200

    except Exception as e:
        return jsonify({"msg": f"Error al obtener historial: {str(e)}"}), 500
