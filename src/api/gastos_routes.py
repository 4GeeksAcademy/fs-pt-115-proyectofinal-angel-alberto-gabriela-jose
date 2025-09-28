from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from api.models import db, Hogar, User, Gasto
import logging

gastos_bp = Blueprint('gastos_bp', __name__)


@gastos_bp.route('/gastos', methods=['GET'])
@jwt_required()
def obtener_gastos():
    try:
        usuario_actual_id = get_jwt_identity()
        usuario_actual = User.query.get(usuario_actual_id)

        if not usuario_actual:
            return jsonify({"error": "Usuario no encontrado"}), 404

        if not usuario_actual.casa_id:
            return jsonify([]), 200

        gastos = Gasto.query.filter_by(
            casa_id=usuario_actual.casa_id).order_by(Gasto.fecha.desc()).all()

        return jsonify([gasto.serialize() for gasto in gastos]), 200

    except Exception as e:
        logging.exception("Ocurrió un error en obtener_gastos")
        return jsonify({"error": f"Error al obtener gastos: {str(e)}"}), 500


@gastos_bp.route('/gastos', methods=['POST'])
@jwt_required()
def crear_gasto():
    try:
        usuario_actual_id = get_jwt_identity()
        usuario_actual = User.query.get(usuario_actual_id)

        if not usuario_actual:
            return jsonify({"error": "Usuario no encontrado"}), 404

        if not usuario_actual.casa_id:
            return jsonify({"error": "El usuario no pertenece a un hogar"}), 400

        data = request.get_json()

        if not data:
            return jsonify({"error": "Datos no proporcionados"}), 400

        required_fields = ['descripcion', 'monto', 'fecha', 'usuario']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({"error": f"Campo requerido: {field}"}), 400

        try:
            monto_float = float(data['monto'])
        except (ValueError, TypeError):
            return jsonify({"error": "El campo monto chequea"}), 400

        try:
            fecha_gasto = datetime.fromisoformat(
                data['fecha'].replace('Z', '+00:00'))
        except ValueError:
            return jsonify({"error": "Formato de fecha inválido. Use YYY-MM-DD"}), 400

        nuevo_gasto = Gasto(
            descripcion=data['descripcion'].strip(),
            monto=monto_float,
            fecha=fecha_gasto,
            usuario=data['usuario'],
            compartido=data.get('compartido', False),
            casa_id=usuario_actual.casa_id
        )

        db.session.add(nuevo_gasto)
        db.session.commit()

        return jsonify(nuevo_gasto.serialize()), 201

    except Exception as e:
        db.session.rollback()
        logging.exception("Ocurrió un error inesperado al crear el gasto")
        return jsonify({"error": f"Error al crear gasto: {str(e)}"}), 500


@gastos_bp.route('/gastos/<int:gasto_id>', methods=['PUT'])
@jwt_required()
def actualizar_gasto(gasto_id):
    try:
        usuario_actual_id = get_jwt_identity()
        usuario_actual = User.query.get(usuario_actual_id)

        gasto = Gasto.query.get(gasto_id)
        if not gasto:
            return jsonify({"error": "Gasto no encontrado"}), 404

        if gasto.casa_id != usuario_actual.casa_id:
            return jsonify({"error": "No autorizado para modificar este gasto"}), 403

        data = request.get_json()
        if not data:
            return jsonify({"error": "Datos no proporcionados"}), 400

        if 'descripcion' in data:
            gasto.descripcion = data['descripcion'].strip()

        if 'monto' in data:
            try:
                gasto.monto = float(data['monto'])
            except (ValueError, TypeError):
                return jsonify({"error": "El campo 'monto' debe ser un número válido."}), 400

        if 'fecha' in data:
            try:
                fecha_actualizada = datetime.fromisoformat(
                    data['fecha'].replace('Z', '+00:00'))
                gasto.fecha = fecha_actualizada
            except ValueError:
                return jsonify({"error": "Formato de fecha inválido"}), 400

        if 'usuario' in data:
            gasto.usuario = data['usuario']

        if 'compartido' in data:
            gasto.compartido = bool(data['compartido'])

        gasto.actualizado_en = datetime.utcnow()
        db.session.commit()

        return jsonify(gasto.serialize()), 200

    except Exception as e:
        db.session.rollback()
        logging.exception("Ocurrió un error al actualizar el gasto")
        return jsonify({"error": f"Error al actualizar gasto: {str(e)}"}), 500


@gastos_bp.route('/gastos/<int:gasto_id>', methods=['DELETE'])
@jwt_required()
def eliminar_gasto(gasto_id):
    try:
        usuario_actual_id = get_jwt_identity()
        usuario_actual = User.query.get(usuario_actual_id)

        gasto = Gasto.query.get(gasto_id)
        if not gasto:
            return jsonify({"error": "Gasto no encontrado"}), 404

        if gasto.casa_id != usuario_actual.casa_id:
            return jsonify({"error": "No autorizado para eliminar este gasto"}), 403

        db.session.delete(gasto)
        db.session.commit()

        return jsonify({"message": "Gasto eliminado correctamente"}), 200

    except Exception as e:
        db.session.rollback()
        logging.exception("Ocurrió un error al eliminar el gasto")
        return jsonify({"error": f"Error al eliminar gasto: {str(e)}"}), 500


@gastos_bp.route('/gastos/resumen', methods=['GET'])
@jwt_required()
def obtener_resumen_gastos():
    try:
        usuario_actual_id = get_jwt_identity()
        usuario_actual = User.query.get(usuario_actual_id)

        if not usuario_actual or not usuario_actual.casa_id:
            return jsonify({"error": "Usuario no pertenece a un hogar"}), 400

        gastos = Gasto.query.filter_by(casa_id=usuario_actual.casa_id).all()

        gastos_compartidos = [g for g in gastos if g.compartido]
        gastos_individuales = [g for g in gastos if not g.compartido]

        total_compartido = sum(g.monto for g in gastos_compartidos)
        total_individual = sum(g.monto for g in gastos_individuales)

        hogar = Hogar.query.get(usuario_actual.casa_id)
        miembros = hogar.users if hogar else []
        cuota_compartida = total_compartido / \
            len(miembros) if miembros and total_compartido > 0 else 0

        gastos_por_usuario = {}
        for usuario in miembros:
            gastos_usuario = [
                g for g in gastos_individuales if g.usuario == usuario.nombre]
            total_usuario = sum(g.monto for g in gastos_usuario)
            gastos_por_usuario[usuario.nombre] = {
                "gastos_individuales": total_usuario,
                "cuota_compartida": cuota_compartida,
                "total": total_usuario + cuota_compartida
            }

        resumen = {
            "total_gastos_compartidos": total_compartido,
            "total_gastos_individuales": total_individual,
            "total_general": total_compartido + total_individual,
            "cuota_compartida_por_usuario": cuota_compartida,
            "gastos_por_usuario": gastos_por_usuario,
            "total_miembros": len(miembros)
        }

        return jsonify(resumen), 200

    except Exception as e:
        logging.exception("Ocurrió un error al obtener el resumen de gastos")
        return jsonify({"error": f"Error al obtener resumen: {str(e)}"}), 500
