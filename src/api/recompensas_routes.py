from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .models import db, User, Reward, Hogar

recompensas_bp = Blueprint('recompensas_bp', __name__)

@recompensas_bp.route('/recompensas', methods=['POST'])
@jwt_required()
def create_reward():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user.casa_id:
        return jsonify({"msg": "Debes pertenecer a un hogar para crear recompensas"}), 400

    data = request.get_json()
    title = data.get('titulo')
    description = data.get('descripcion')
    costo = data.get('costo')
    emoji = data.get('emoji')

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

@recompensas_bp.route('/recompensas/<int:reward_id>', methods=['DELETE'])
@jwt_required()
def delete_reward(reward_id):
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