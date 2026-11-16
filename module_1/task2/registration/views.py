from django.shortcuts import render

# Create your views here.
import re

from django.core import signing
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.shortcuts import render, redirect


MAX_FILE_SIZE = 2 * 1024 * 1024  # 2 MB

ALLOWED_EXTENSIONS = {
    ".pdf",
    ".jpg",
    ".jpeg",
    ".png",
}

ALLOWED_GENDERS = {
    "male",
    "female",
    "other",
}

ALLOWED_INTERESTS = {
    "python",
    "django",
    "ai",
    "web",
}


def validate_registration(data, uploaded_file):
    """
    IMPORTANT SECURITY RULE:

    These validation rules intentionally duplicate the browser-side
    validation. Client-side validation improves user experience, but
    attackers can completely bypass HTML/JavaScript. The server is the
    security boundary, so every field must be independently validated here.
    """

    errors = {}

    name = data.get("name", "").strip()

    if not name:
        errors["name"] = "Name is required."
    elif len(name) < 2:
        errors["name"] = "Name must contain at least 2 characters."
    elif len(name) > 50:
        errors["name"] = "Name must not exceed 50 characters."
    elif not re.fullmatch(r"[A-Za-z ]+", name):
        errors["name"] = "Name may contain only letters and spaces."

    email = data.get("email", "").strip()

    if not email:
        errors["email"] = "Email is required."
    elif len(email) > 254:
        errors["email"] = "Email is too long."
    else:
        try:
            validate_email(email)
        except ValidationError:
            errors["email"] = "Enter a valid email address."

    password = data.get("password", "")

    if not password:
        errors["password"] = "Password is required."
    elif len(password) < 8:
        errors["password"] = "Password must contain at least 8 characters."
    elif len(password) > 64:
        errors["password"] = "Password must not exceed 64 characters."

    age = data.get("age", "").strip()

    if not age:
        errors["age"] = "Age is required."
    else:
        try:
            age_value = int(age)

            if age_value < 18:
                errors["age"] = "You must be at least 18."
            elif age_value > 100:
                errors["age"] = "Age must not exceed 100."

        except ValueError:
            errors["age"] = "Age must be a valid number."

    phone = data.get("phone", "").strip()

    if not phone:
        errors["phone"] = "Phone number is required."
    elif not re.fullmatch(r"\+?[0-9]{10,15}", phone):
        errors["phone"] = (
            "Phone must contain 10-15 digits and may start with +."
        )

    gender = data.get("gender", "")

    if gender not in ALLOWED_GENDERS:
        errors["gender"] = "Select a valid gender."

    interests = data.getlist("interests")

    if not interests:
        errors["interests"] = "Select at least one interest."

    elif not set(interests).issubset(ALLOWED_INTERESTS):
        errors["interests"] = "Invalid interest selected."

    if data.get("terms") != "yes":
        errors["terms"] = "You must accept the terms."

    if uploaded_file:
        if uploaded_file.size > MAX_FILE_SIZE:
            errors["document"] = "File must not exceed 2 MB."

        extension = ""

        if "." in uploaded_file.name:
            extension = "." + uploaded_file.name.rsplit(".", 1)[1].lower()

        if extension not in ALLOWED_EXTENSIONS:
            errors["document"] = (
                "Only PDF, JPG, JPEG and PNG files are allowed."
            )

    else:
        errors["document"] = "Please upload a document."

    return errors


def register(request):

    if request.method == "POST":

        hidden_value = request.POST.get("form_token", "")

        try:
            original_value = signing.loads(
                hidden_value,
                salt="registration-form"
            )

            if original_value != "registration-v1":
                raise signing.BadSignature

        except signing.BadSignature:
            return render(
                request,
                "registration.html",
                {
                    "form_error": "Invalid form token. Possible tampering detected."
                },
                status=400,
            )

        errors = validate_registration(
            request.POST,
            request.FILES.get("document")
        )

        if errors:
            return render(
                request,
                "registration/register.html",
                {
                    "errors": errors,
                    "old": request.POST,
                },
                status=400,
            )

        name = request.POST.get("name", "").strip()

        request.session["registered_name"] = name

        return redirect("registration:success")

    token = signing.dumps(
        "registration-v1",
        salt="registration-form"
    )

    return render(
        request,
        "registration.html",
        {
            "form_token": token
        }
    )


def success(request):

    name = request.session.get(
        "registered_name",
        "User"
    )

    return render(
        request,
        "success.html",
        {
            "name": name
        }
    )