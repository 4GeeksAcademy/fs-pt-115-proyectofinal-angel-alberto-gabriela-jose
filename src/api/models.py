from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import String, Boolean, Integer, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime

db = SQLAlchemy()


# Tabla intermedia para la relación Muchos a Muchos entre User y Unlockable
user_unlocks = db.Table('user_unlocks',
                        db.Column('user_id', Integer, ForeignKey(
                            'users.id'), primary_key=True),
                        db.Column('unlockable_id', Integer, ForeignKey('unlockables.id'),
                                  primary_key=True)
                        )


class Hogar(db.Model):
    __tablename__ = 'casas'

    id = mapped_column(Integer, primary_key=True)
    nombre = mapped_column(String(100), nullable=False)
    invitation_link = mapped_column(String(255), unique=True, nullable=True)
    created_at = mapped_column(DateTime, default=datetime.utcnow)

    # Relaciones con las otras tablas
    users = relationship("User", back_populates="casa")
    tasks = relationship("Task", back_populates="casa",
                         cascade="all, delete-orphan")
    shopping_items = relationship(
        "ShoppingItem", back_populates="casa", cascade="all, delete-orphan")
    rewards = relationship("Reward", back_populates="casa",
                           cascade="all, delete-orphan")
    goals = relationship("Goal", back_populates="casa",
                         cascade="all, delete-orphan")

    def serialize(self):
        return {
            "id": self.id,
            "nombre": self.nombre,
            "invitation_link": self.invitation_link
        }


class User(db.Model):
    __tablename__ = 'users'

    id = mapped_column(Integer, primary_key=True)
    nombre = mapped_column(String(100), nullable=False)
    email = mapped_column(String(120), unique=True, nullable=False)
    password_hash = mapped_column(String(255), nullable=False)
    role = mapped_column(String(20), default='miembro')
    puntos = mapped_column(Integer, default=0)
    created_at = mapped_column(DateTime, default=datetime.utcnow)

    casa_id = mapped_column(Integer, ForeignKey('casas.id'), nullable=True)

    # --- Relaciones ---
    casa = relationship("Hogar", back_populates="users")
    profile = relationship("UserProfile", back_populates="user",
                           uselist=False, cascade="all, delete-orphan")
    unlocked_items = relationship(
        "Unlockable", secondary=user_unlocks, back_populates="users")

    # Tarea creada por el usuario
    created_tasks = relationship(
        "Task", foreign_keys="Task.creator_id", back_populates="creator")
    # Tarea que tiene que hacer el usuario
    assigned_tasks = relationship(
        "Task", foreign_keys='Task.asignado_a', back_populates="assignee")

    # Recompensas que canjeó
    redeemed_rewards = relationship(
        "Reward", foreign_keys='Reward.canjeado_por', back_populates="canjeador")

    def serialize(self):
        return {
            "id": self.id,
            "nombre": self.nombre,
            "email": self.email,
            "role": self.role,
            "puntos": self.puntos,
            "casa_id": self.casa_id
        }


class UserProfile(db.Model):
    __tablename__ = 'user_profiles'

    id = mapped_column(Integer, primary_key=True)
    user_id = mapped_column(Integer, ForeignKey('users.id'), nullable=False)

    user = relationship("User", back_populates="user_profiles")


class Task(db.Model):
    __tablename__ = 'tasks'

    id = mapped_column(Integer, primary_key=True)
    title = mapped_column(String(200), nullable=False)
    description = mapped_column(Text, nullable=True)
    fecha_limite = mapped_column(DateTime, nullable=True)
    estado = mapped_column(String(20), default="pendiente")
    puntos = mapped_column(Integer, default=10)
    created_at = mapped_column(DateTime, default=datetime.utcnow)
    completed_at = mapped_column(DateTime, nullable=True)

    casa_id = mapped_column(Integer, ForeignKey("casas.id"), nullable=False)
    asignado_a = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    creator_id = mapped_column(Integer, ForeignKey("users.id"), nullable=False)

    casa = relationship("Hogar", back_populates="tasks")
    assignee = relationship("User", foreign_keys=[
                            asignado_a], back_populates="assigned_tasks")
    creator = relationship("User", foreign_keys=[
                           creator_id], back_populates="created_tasks")

    def serialize(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "fecha_limite": self.fecha_limite.isoformat() if self.fecha_limite else None,
            "estado": self.estado,
            "puntos": self.puntos,
            "created_at": self.created_at.isoformat(),
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "casa_id": self.casa_id,
            "asignado_a": self.asignado_a,
            "creator_id": self.creator_id
        }


class ShoppingItem(db.Model):
    __tablename__ = "shopping_list"

    id = mapped_column(Integer, primary_key=True)
    producto = mapped_column(String(200), nullable=False)
    cantidad = mapped_column(String(100), nullable=True)
    comprado = mapped_column(Boolean, default=False)
    created_at = mapped_column(DateTime, default=datetime.utcnow)

    casa_id = mapped_column(Integer, ForeignKey('casas.id'), nullable=False)

    casa = relationship("Hogar", back_populates="shopping_list")

    def serialize(self):
        return {
            "id": self.id,
            "producto": self.producto,
            "cantidad": self.cantidad,
            "comprado": self.comprado
        }


class Goal(db.Model):
    __tablename__ = "goals"

    id = mapped_column(Integer, primary_key=True)
    title = mapped_column(String(200), nullable=False)
    description = mapped_column(Text, nullable=True)
    progreso = mapped_column(Integer, default=0)
    meta = mapped_column(Integer, nullable=False)
    created_at = mapped_column(DateTime, default=datetime.utcnow)

    casa_id = mapped_column(Integer, ForeignKey('casas.id'), nullable=False)

    casa = relationship("Hogar", back_populates="goals")


class Reward(db.Model):
    __tablename__ = "rewards"

    id = mapped_column(Integer, primary_key=True)
    title = mapped_column(String(200), nullable=False)
    description = mapped_column(Text, nullable=True)
    costo_puntos = mapped_column(Integer, nullable=False)
    created_at = mapped_column(DateTime, default=datetime.utcnow)

    casa_id = mapped_column(Integer, ForeignKey('casas.id'), nullable=False)
    canjeado_por = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True)

    casa = relationship("Hogar", back_populates="rewards")
    canjeador = relationship("User", foreign_keys=[
                             canjeado_por], back_populates="redeemed_rewards")

    def serialize(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "costo_puntos": self.costo_puntos,
        }


class Unlockable(db.Model):
    __tablename__ = "unlockables"

    id = mapped_column(Integer, primary_key=True)
    name = mapped_column(String(100), unique=True, nullable=False)
    description = mapped_column(String(255), nullable=True)
    item_type = mapped_column(String(50), default="card")
    points_cost = mapped_column(Integer, nullable=False)

    users = relationship("User", secondary=user_unlocks,
                         back_populates="unlocked_items")
