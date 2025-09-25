import os
from flask_admin import Admin
from flask_admin.contrib.sqla import ModelView
from .models import db, User, Hogar, Task, Goal, Reward

# Vista personalizada para Tareas
class TaskAdminView(ModelView):
    form_columns = ['title', 'description', 'casa', 'creator', 'estado', 'puntos', 'fecha_limite']
    form_args = {
        'casa': {'label': 'Hogar', 'allow_blank': False},
        'creator': {'label': 'Creador', 'allow_blank': False}
    }
    column_list = ('id', 'title', 'casa', 'creator', 'estado', 'puntos')
    column_searchable_list = ['title', 'description']
    column_filters = ['estado', 'casa.nombre']

# Vista personalizada para Objetivos
class GoalAdminView(ModelView):
    form_columns = ['title', 'description', 'progreso', 'objetivo', 'casa']
    form_args = {
        'casa': {
            'label': 'Hogar',
            'allow_blank': False
        }
    }
    column_list = ('id', 'title', 'progreso', 'objetivo', 'casa')
    column_filters = ['casa.nombre']

def setup_admin(app):
    app.secret_key = os.environ.get('FLASK_APP_KEY', 'sample key')
    app.config['FLASK_ADMIN_SWATCH'] = 'sandstone'
    admin = Admin(app, name='Aura Admin', template_mode='bootstrap3')

    admin.add_view(ModelView(User, db.session))
    admin.add_view(ModelView(Hogar, db.session))
    admin.add_view(TaskAdminView(Task, db.session))
    admin.add_view(GoalAdminView(Goal, db.session))
    admin.add_view(ModelView(Reward, db.session))