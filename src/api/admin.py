
import os
from flask_admin import Admin
from flask_admin.contrib.sqla import ModelView
from .models import db, User, UserProfile, User, Hogar, Task, Goal, Reward, Unlockable


def setup_admin(app):
    app.secret_key = os.environ.get('FLASK_APP_KEY', 'sample key')
    app.config['FLASK_ADMIN_SWATCH'] = 'sandstone'
    admin = Admin(app, name='Aura Admin', template_mode='bootstrap3')

    # Add your models here, for example this is how we add a the User model to the admin
    admin.add_view(ModelView(User, db.session))
    admin.add_view(ModelView(Unlockable, db.session))
    admin.add_view(ModelView(UserProfile, db.session))
    admin.add_view(ModelView(Hogar, db.session))
    admin.add_view(ModelView(Task, db.session))
    admin.add_view(ModelView(Goal, db.session))
    admin.add_view(ModelView(Reward, db.session))

    # You can duplicate that line to add mew models
    # admin.add_view(ModelView(YourModelName, db.session))