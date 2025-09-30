from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from api.models import db, User, Hogar, Task, Reward, ShoppingItem, Goal
from sqlalchemy import func, desc, label, case
from sqlalchemy.orm import joinedload

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard_data():
    try:
        user_id = get_jwt_identity()
        current_user = User.query.options(joinedload(User.casa)).get(user_id)

        if not current_user:
            return jsonify({"msg": "Usuario no encontrado"}), 404

        if not current_user.casa:
            return jsonify({
                "user": current_user.serialize(),
                "hogar": None,
                "miembros": [current_user.serialize()],
                "stats": { "puntos": current_user.puntos, "tareas_completas": 0, "tareas_pendientes": 0, "recompensas_canjeadas": 0, "compras_pendientes": 0 },
                "tareas_recientes": [], "recompensas_top": [], "ranking": [], "metas_hogar": [], "historial_recompensas": []
            }), 200

        stats_query = db.session.query(
            func.count(case((Task.estado == 'completada', Task.id))).label('tareas_completas'),
            func.count(case((Task.estado == 'pendiente', Task.id))).label('tareas_pendientes'),
            func.count(case((Reward.canjeado_por != None, Reward.id))).label('recompensas_canjeadas'),
            func.count(case((ShoppingItem.comprado == False, ShoppingItem.id))).label('compras_pendientes')
        ).select_from(Hogar)\
        .outerjoin(Task, Hogar.id == Task.casa_id)\
        .outerjoin(Reward, Hogar.id == Reward.casa_id)\
        .outerjoin(ShoppingItem, Hogar.id == ShoppingItem.casa_id)\
        .filter(Hogar.id == current_user.casa_id)\
        .group_by(Hogar.id).first()

        stats = {
            "puntos": current_user.puntos,
            "tareas_completas": stats_query.tareas_completas if stats_query else 0,
            "tareas_pendientes": stats_query.tareas_pendientes if stats_query else 0,
            "recompensas_canjeadas": stats_query.recompensas_canjeadas if stats_query else 0,
            "compras_pendientes": stats_query.compras_pendientes if stats_query else 0
        }

        tareas_recientes = Task.query.filter_by(casa_id=current_user.casa_id).order_by(Task.created_at.desc()).limit(3).all()

        recompensas_top = db.session.query(
            Reward.title,
            func.count(Reward.id).label("veces_canjeada")
        ).filter(
            Reward.casa_id == current_user.casa_id,
            Reward.canjeado_por.isnot(None)
        ).group_by(Reward.title).order_by(desc("veces_canjeada")).limit(10).all()

        ranking_users = User.query.filter_by(casa_id=current_user.casa_id).order_by(desc(User.puntos)).limit(10).all()
        
        ranking_data = []
        for user_in_rank in ranking_users:
            ranking_data.append({
                "usuario_id": user_in_rank.id,
                "nombre": user_in_rank.nombre,
                "puntos": user_in_rank.puntos,
                "usuario_actual": user_in_rank.id == int(user_id)
            })

        metas_hogar = Goal.query.filter_by(casa_id=current_user.casa_id).all()

        metas_formateadas = [
            {
                "id": meta.id, "title": meta.title, "description": meta.description,
                "progreso": meta.progreso, "meta": meta.objetivo,
                "porcentaje_completado": round((meta.progreso / meta.objetivo * 100) if meta.objetivo > 0 else 0, 2)
            } for meta in metas_hogar
        ]
        
        miembros = User.query.filter_by(casa_id=current_user.casa_id).all()

        return jsonify({
            "user": current_user.serialize(),
            "hogar": current_user.casa.serialize(),
            "miembros": [m.serialize() for m in miembros],
            "stats": stats,
            "tareas_recientes": [tarea.serialize() for tarea in tareas_recientes],
            "recompensas_top": [{"title": r[0], "veces_canjeada": r[1]} for r in recompensas_top],
            "ranking": ranking_data,
            "metas_hogar": metas_formateadas,
        }), 200

    except Exception as e:
        return jsonify({"msg": f"Error al obtener datos del dashboard: {str(e)}"}), 500
