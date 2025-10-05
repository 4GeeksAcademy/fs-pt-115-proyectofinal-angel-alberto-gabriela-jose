# configurar_dominio_resend.py
import os
import resend
from dotenv import load_dotenv

# Cargar variables del .env
load_dotenv()


def configurar_dominio():
    # Configurar API key desde tu .env
    resend.api_key = os.getenv('RESEND_API_KEY')

    if not resend.api_key:
        print("❌ ERROR: RESEND_API_KEY no encontrada en .env")
        return

    dominio = "aura-app.resend.dev"

    print(f"🔄 Configurando dominio: {dominio}")

    try:

        resultado = resend.Domains.create({
            "name": dominio
        })

        print("✅ Dominio creado exitosamente en Resend!")
        print(f"   📧 Dominio: {resultado['name']}")
        print(f"   🆔 ID: {resultado['id']}")
        print(f"   📊 Estado: {resultado['status']}")
        print(f"   🔧 Registros DNS: {resultado.get('records', [])}")

        print("\n🎉 Ahora puedes usar en tu código:")
        print(f"   from: 'AURA <tucuenta@{dominio}>'")

    except Exception as e:
        print(f"❌ Error creando dominio: {e}")
        print("\n💡 Posibles soluciones:")
        print("   - El dominio ya existe en tu cuenta Resend")
        print("   - El nombre no está disponible")
        print("   - Prueba con otro nombre como: aura-tunombre.resend.dev")


if __name__ == "__main__":
    configurar_dominio()
