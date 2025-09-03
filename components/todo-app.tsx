"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Tag } from "lucide-react"
import { TaskItem } from "./task-item"
import { AddTaskDialog } from "./add-task-dialog"

export interface Task {
  id: string
  title: string
  completed: boolean
  color: string
  tags: string[]
  reminder?: Date
  subtasks: Task[]
  parentId?: string
}

export function TodoApp() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [filter, setFilter] = useState<string>("")

  // Load tasks from localStorage on mount
  useEffect(() => {
    const savedTasks = localStorage.getItem("todo-tasks")
    if (savedTasks) {
      const parsedTasks = JSON.parse(savedTasks)
      // Convert reminder strings back to Date objects
      const tasksWithDates = parsedTasks.map((task: any) => ({
        ...task,
        reminder: task.reminder ? new Date(task.reminder) : undefined,
        subtasks:
          task.subtasks?.map((subtask: any) => ({
            ...subtask,
            reminder: subtask.reminder ? new Date(subtask.reminder) : undefined,
          })) || [],
      }))
      setTasks(tasksWithDates)
    }
  }, [])

  // Save tasks to localStorage whenever tasks change
  useEffect(() => {
    localStorage.setItem("todo-tasks", JSON.stringify(tasks))
  }, [tasks])

  const addTask = (taskData: Omit<Task, "id" | "completed" | "subtasks">, parentId?: string) => {
    const newTask: Task = {
      ...taskData,
      id: Date.now().toString(),
      completed: false,
      subtasks: [],
      parentId,
    }

    if (parentId) {
      // Add as subtask
      setTasks((prev) =>
        prev.map((task) => (task.id === parentId ? { ...task, subtasks: [...task.subtasks, newTask] } : task)),
      )
    } else {
      // Add as main task
      setTasks((prev) => [...prev, newTask])
    }
  }

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    const updateTaskRecursive = (tasks: Task[]): Task[] => {
      return tasks.map((task) => {
        if (task.id === taskId) {
          return { ...task, ...updates }
        }
        if (task.subtasks.length > 0) {
          return { ...task, subtasks: updateTaskRecursive(task.subtasks) }
        }
        return task
      })
    }
    setTasks((prev) => updateTaskRecursive(prev))
  }

  const deleteTask = (taskId: string) => {
    const deleteTaskRecursive = (tasks: Task[]): Task[] => {
      return tasks.filter((task) => {
        if (task.id === taskId) return false
        if (task.subtasks.length > 0) {
          task.subtasks = deleteTaskRecursive(task.subtasks)
        }
        return true
      })
    }
    setTasks((prev) => deleteTaskRecursive(prev))
  }

  const getAllTags = () => {
    const allTags = new Set<string>()
    const extractTags = (tasks: Task[]) => {
      tasks.forEach((task) => {
        task.tags.forEach((tag) => allTags.add(tag))
        extractTags(task.subtasks)
      })
    }
    extractTags(tasks)
    return Array.from(allTags)
  }

  const filteredTasks = tasks.filter((task) => {
    if (!filter) return true
    return (
      task.tags.includes(filter) ||
      task.title.toLowerCase().includes(filter.toLowerCase()) ||
      task.subtasks.some(
        (subtask) => subtask.tags.includes(filter) || subtask.title.toLowerCase().includes(filter.toLowerCase()),
      )
    )
  })

  const allTags = getAllTags()

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Todo App</h1>
        <p className="text-muted-foreground">Stay organized with hierarchical tasks, tags, and reminders</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Tasks</CardTitle>
            <Button onClick={() => setShowAddDialog(true)} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filter by tags */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Button variant={filter === "" ? "default" : "outline"} size="sm" onClick={() => setFilter("")}>
                All
              </Button>
              {allTags.map((tag) => (
                <Button
                  key={tag}
                  variant={filter === tag ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(filter === tag ? "" : tag)}
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </Button>
              ))}
            </div>
          )}

          {/* Task list */}
          <div className="space-y-3">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {filter ? `No tasks found with "${filter}"` : "No tasks yet. Add your first task!"}
              </div>
            ) : (
              filteredTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onUpdate={updateTask}
                  onDelete={deleteTask}
                  onAddSubtask={addTask}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <AddTaskDialog open={showAddDialog} onOpenChange={setShowAddDialog} onAddTask={addTask} />
    </div>
  )
}
