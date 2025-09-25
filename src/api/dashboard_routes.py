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

        if not current_user:
            return jsonify({"msg": "Usuario no encontrado"}), 404

        if not current_user.casa_id:
            return jsonify({
                "user": current_user.serialize(),
                "hogar": None,
                "stats": {
                    "puntos": current_user.puntos,
                    "tareas_completas": 0,
                    "tareas_pendientes": 0,
                    "recompensas_canjeadas": 0
                }
            }), 200

        hogar = Hogar.query.get(current_user.casa_id)

        tareas_completas = Task.query.filter_by(
            casa_id=current_user.casa_id,
            asignado_a=user_id,
            estado="completa"
        ).count()

        tareas_pendientes = Task.query.filter_by(
            casa_id=current_user.casa_id,
            asignado_a=user_id,
            estado="pendiente"
        ).count()

        recompensas_canjeadas = Reward.query.filter_by(
            casa_id=current_user.casa_id,
            canjeado_por=user_id).count()

        tareas_recientes = Task.query.filter_by(
            casa_id=current_user.casa_id).order_by(Task.created_at.desc()).limit(3).all()

        recompensas_top = db.session.query(
            Reward.title,
            func.count(Reward.id), label("veces_canjeada")
        ).filter(
            Reward.casa_id == current_user.casa_id,
            Reward.canjeado_por.isnot(None)
        ).group_by(Reward.title).order_by(desc(func.count(Reward.id))).limit(10).all()

        ranking = User.query.filter_by(casa_id=current_user.casa_id).order_by(
            desc(User.puntos)).limit(10).all()

        metas_hogar = Goal.query.filter_by(casa_id=current_user.casa_id).all()

        metas_formateadas = []
        for meta in metas_hogar:
            porcentaje = (meta.progreso / meta.objetivo *
                          100) if meta.objetivo > 0 else 0
            metas_formateadas.append({
                "id": meta.id,
                "title": meta.title,
                "description": meta.description,
                "progreso": meta.progreso,
                "meta": meta.objetivo,
                "porcentaje_completado": round(porcentaje, 2)
            })

        compras_pendientes = ShoppingItem.query.filter_by(
            casa_id=current_user.casa_id, comprado=False).count()

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

        return jsonify({
            "user": current_user.serialize(),
            "hogar": hogar.serialize(),
            "stats": {
                "puntos": current_user.puntos,
                "tareas_completas": tareas_completas,
                "tareas_pendientes": tareas_pendientes,
                "recompensas_canjeadas": recompensas_canjeadas,
                "compras_pendientes": compras_pendientes
            },
            "tareas_recientes": [tarea.serialize() for tarea in tareas_recientes],
            "recompensas_top": [{"title": r[0], "veces_canjeada": r[1]} for r in recompensas_top],
            "ranking": [{"nombre": user.nombre, "puntos": user.puntos} for user in ranking],
            "metas_hogar": metas_formateadas,
            "historial_recompensas": historial_formateado
        }), 200

    except Exception as e:
        return jsonify({"msg": f"Error al obtener datos: {str(e)}"}), 500


@dashboard_bp.route('/rewards', methods=['GET'])
@jwt_required()
def get_rewards():
    try:
        user_id = get_jwt_identity()
        current_user = User.query.get(user_id)

        if not current_user or not current_user.casa_id:
            return jsonify({"msg": "El usuario no pertenece a un hogar"}), 400

        recompensas = Reward.query.filter_by(
            casa_id=current_user.casa_id).all()
        return jsonify({
            "recompensas": [reward.serialize() for reward in recompensas]
        }), 200

    except Exception as e:
        return jsonify({"msg": f"Error al obtener recompensas. {str(e)}"}), 500


@dashboard_bp.route('/rewards/redeem/<int:reward_id>', methods=['POST'])
@jwt_required()
def redeem_reward(reward_id):
    try:
        user_id = get_jwt_identity()
        current_user = User.query.get(user_id)

        if not current_user:
            return jsonify({"msg": "Usuario no encontrado"}), 404

        recompensa = Reward.query.get(reward_id)

        if not recompensa:
            return jsonify({"msg": "Recompensa no encontrada"}), 404

        if not current_user.puntos < recompensa.costo_puntos:
            return jsonify({"msg": "No tienes suficientes puntos"}), 400

        if not recompensa.canjeado_por:
            return jsonify({"msg": "La recompensa ya ha sido canjeada"}), 400

        current_user.puntos -= recompensa.costo_puntos
        recompensa.canjeado_por = user_id

        db.session.commit()
        return jsonify({
            "msg": "Recompensa canjeada",
            "puntos_restantes": current_user.puntos,
            "recompensa": recompensa.serialize()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": f"Error al canjear la recompensa: {str(e)}"}), 500


@dashboard_bp.route('/ranking', methods=['GET'])
@jwt_required()
def get_ranking():
    try:
        user_id = get_jwt_identity()
        current_user = User.query.get(user_id)

        if not current_user or not current_user.casa_id:
            return jsonify({"msg": "Usuario no pertenece al hogar"}), 400

        ranking = User.query.filter_by(
            casa_id=current_user.casa_id).order_by(desc(User.puntos)).all()

        ranking_data = []
        for i, user in enumerate(ranking):
            ranking_data.append({
                "posicion": i + 1,
                "usuario_id": user.id,
                "nombre": user.nombre,
                "puntos": user.puntos,
                "usuario_actual": user.id == current_user.id
            })

        return jsonify({"ranking": ranking_data}), 200

    except Exception as e:
        return jsonify({"msg": f"Error al obtener el ranking: {str(e)}"}), 500