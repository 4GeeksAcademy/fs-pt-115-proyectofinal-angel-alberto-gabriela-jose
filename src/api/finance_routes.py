from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from api.models import db, Hogar, ShoppingItem, Goal  # <--- LÍNEA CORREGIDA

finance_bp = Blueprint('finance_bp', __name__)

### compras###
### crear nuevo producto a la compra##


@finance_bp.route("/shopping", methods=["POST"])
@jwt_required()
def add_shopping_item():
    data = request.get_json()
    producto = data.get("producto")
    cantidad = data.get("cantidad")
    casa_id = data.get("casa_id")

    if not producto or not casa_id:
        return jsonify({"msg": "datos incorrectos"}), 400

    hogar = Hogar.query.get(casa_id)
    if not hogar:
        return jsonify({"msg": "hogar no encontrado"}), 400

    new_item = ShoppingItem(
        producto=producto,
        cantidad=cantidad,
        casa_id=casa_id
    )
    db.session.add(new_item)
    db.session.commit()
    return jsonify(new_item.serialize()), 200


### cargar las compras del hogar###

@finance_bp.route("/shopping/<int:casa_id>", methods=["GET"])
@jwt_required()
def get_shopping_items(casa_id):
    hogar = Hogar.query.get(casa_id)
    if not hogar:
        return jsonify({"msg": "hogar no encontrado"}), 400
    return jsonify([item.serialize() for item in hogar.shopping_items]), 200

### actualizar los productos del hogar###


@finance_bp.route("/shopping/<int:item_id>", methods=["PUT"])
@jwt_required()
def mark_shopping_item_bought(item_id):
    item = ShoppingItem.query.get(item_id)
    if not item:
        return jsonify({"msg": "item no encontrado"}), 400

    item.comprado = True
    db.session.commit()
    return jsonify(item.serialize()), 200

### eliminar algo de lista compras###


@finance_bp.route("/shopping/<int:item_id>", methods=["DELETE"])
@jwt_required()
def delete_shopping_item(item_id):
    item = ShoppingItem.query.get(item_id)
    if not item:
        return jsonify({"msg": "item no encontrado"}), 400

    db.session.delete(item)
    db.session.commit()
    return jsonify({"msg": "item borrado"}), 200


## goals##
## crear una meta###
@finance_bp.route("/goals", methods=["POST"])
@jwt_required()
def create_goal():
    data = request.get_json()
    title = data.get("title")
    description = data.get("description")
    meta = data.get("meta")
    casa_id = data.get("casa_id")

    if not title or not meta or not casa_id:
        return jsonify({"msg": "faltan datos"}), 400

    hogar = Hogar.query.get(casa_id)
    if not hogar:
        return jsonify({"msg": "hogar no encontrado"}), 400

    new_goal = Goal(
        title=title,
        description=description,
        meta=meta,
        casa_id=casa_id
    )
    db.session.add(new_goal)
    db.session.commit()
    return jsonify({
        "id": new_goal.id,
        "title": new_goal.title,
        "description": new_goal.description,
        "meta": new_goal.meta,
        "progreso": new_goal.progreso
    }), 200


### pedir las metas del hogar##

@finance_bp.route("/goals/<int:casa_id>", methods=["GET"])
@jwt_required()
def get_goals(casa_id):
    hogar = Hogar.query.get(casa_id)
    if not hogar:
        return jsonify({"msg": "hogar no encontrado"}), 400

    return jsonify([
        {
            "id": goal.id,
            "title": goal.title,
            "description": goal.description,
            "meta": goal.meta,
            "progreso": goal.progreso
        }
        for goal in hogar.goals
    ]), 200

### act las metas###


@finance_bp.route("/goals/<int:goal_id>", methods=["PUT"])
@jwt_required()
def update_goal(goal_id):
    goal = Goal.query.get(goal_id)
    if not goal:
        return jsonify({"msg": "goals no encontrado"}), 400

    data = request.get_json()
    goal.progreso = data.get("progreso", goal.progreso)
    db.session.commit()
    return jsonify({
        "id": goal.id,
        "title": goal.title,
        "description": goal.description,
        "meta": goal.meta,
        "progreso": goal.progreso
    }), 200

### eliminar metas###


@finance_bp.route("/goals/<int:goal_id>", methods=["DELETE"])
@jwt_required()
def delete_goal(goal_id):
    goal = Goal.query.get(goal_id)
    if not goal:
        return jsonify({"msg": "goal no encontrado"}), 400

    db.session.delete(goal)
    db.session.commit()
    return jsonify({"msg": "goal eliminado correctamente"}), 200
