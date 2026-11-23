from django.shortcuts import render

# Create your views here.
import json

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .models import Task


@csrf_exempt
def task_list(request):
    if request.method == "GET":
        search = request.GET.get("search", "").strip()

        tasks = Task.objects.all().order_by("-created_at")

        if search:
            tasks = tasks.filter(title__icontains=search)

        data = [
            {
                "id": task.id,
                "title": task.title,
                "completed": task.completed,
            }
            for task in tasks
        ]

        return JsonResponse(data, safe=False)

    if request.method == "POST":

        # Used only to demonstrate optimistic rollback.
        if request.GET.get("fail") == "1":
            return JsonResponse(
                {"error": "Deliberate server failure"},
                status=500
            )

        try:
            body = json.loads(request.body)
            title = body.get("title", "").strip()

            if not title:
                return JsonResponse(
                    {"error": "Title is required"},
                    status=400
                )

            task = Task.objects.create(title=title)

            return JsonResponse(
                {
                    "id": task.id,
                    "title": task.title,
                    "completed": task.completed,
                },
                status=201
            )

        except Exception:
            return JsonResponse(
                {"error": "Invalid request"},
                status=400
            )


@csrf_exempt
def task_detail(request, task_id):

    try:
        task = Task.objects.get(id=task_id)
    except Task.DoesNotExist:
        return JsonResponse(
            {"error": "Task not found"},
            status=404
        )

    # DELIBERATE FAILURE FOR OPTIMISTIC UPDATE TESTING
    if request.GET.get("fail") == "1":
        return JsonResponse(
            {"error": "Deliberate server failure"},
            status=500
        )

    if request.method == "PUT":

        try:
            body = json.loads(request.body)

            if "title" in body:
                title = body["title"].strip()

                if not title:
                    return JsonResponse(
                        {"error": "Title cannot be empty"},
                        status=400
                    )

                task.title = title

            if "completed" in body:
                task.completed = bool(body["completed"])

            task.save()

            return JsonResponse(
                {
                    "id": task.id,
                    "title": task.title,
                    "completed": task.completed,
                }
            )

        except Exception:
            return JsonResponse(
                {"error": "Invalid request"},
                status=400
            )

    if request.method == "DELETE":
        task.delete()

        return JsonResponse(
            {"message": "Task deleted"}
        )

    return JsonResponse(
        {"error": "Method not allowed"},
        status=405
    )