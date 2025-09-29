from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from api.models import db, User, Reward, HistorialCanjes
from datetime import datetime

recompensas_bp = Blueprint('recompensas_bp', __name__)

# --- Crear recompensa ---
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


# --- Eliminar recompensa ---
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


# --- Obtener recompensas del hogar ---
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


# --- Historial de canjes ---
@recompensas_bp.route('/recompensas/historial', methods=['GET'])
@jwt_required()
def get_reward_history():
    try:
        registros = HistorialCanjes.query.order_by(HistorialCanjes.fecha.desc()).all()
        return jsonify([r.serialize() for r in registros]), 200
    except Exception as e:
        return jsonify({"msg": f"Error al obtener historial: {str(e)}"}), 500


# --- Canjear carta predeterminada ---
@recompensas_bp.route('/recompensas/canjear_default', methods=['POST'])
@jwt_required()
def canjear_carta_default():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        data = request.get_json()

        titulo = data.get("titulo")
        costo = data.get("costo")

        if not titulo or costo is None:
            return jsonify({"msg": "Título y costo son requeridos"}), 400

        if user.puntos < int(costo):
            return jsonify({"msg": "No tienes suficientes puntos"}), 400

        # descontar puntos en DB
        user.puntos -= int(costo)

        # guardar en historial con título y costo
        nuevo_registro = HistorialCanjes(
            usuario_id=user.id,
            recompensa_id=None,
            titulo=titulo,
            costo=int(costo)
        )
        db.session.add(nuevo_registro)
        db.session.commit()

        return jsonify({
            "msg": "Carta predeterminada canjeada",
            "nuevo_saldo": user.puntos,
            "historial": nuevo_registro.serialize()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": f"Error al canjear carta predeterminada: {str(e)}"}), 500

# --- limpiar historial de canjes ---
@recompensas_bp.route('/recompensas/historial', methods=['DELETE'])
@jwt_required()
def limpiar_historial():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

       
        # borrar historial de todos los usuarios de la casa
        historial = HistorialCanjes.query.join(User).filter(User.casa_id == user.casa_id).all()
        for registro in historial:
            db.session.delete(registro)

        db.session.commit()
        return jsonify({"msg": "Historial de canjes borrado"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": f"Error al limpiar historial: {str(e)}"}), 500

