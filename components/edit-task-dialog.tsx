"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { Task } from "./todo-app"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { X, Plus } from "lucide-react"

interface EditTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: Task
  onUpdate: (taskId: string, updates: Partial<Task>) => void
}

export function EditTaskDialog({ open, onOpenChange, task, onUpdate }: EditTaskDialogProps) {
  const [title, setTitle] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  const [reminder, setReminder] = useState("")
  const [color, setColor] = useState("bg-card")

  useEffect(() => {
    if (open && task) {
      setTitle(task.title)
      setTags([...task.tags])
      setColor(task.color)
      if (task.reminder) {
        const date = new Date(task.reminder)
        const localDateTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        setReminder(localDateTime.toISOString().slice(0, 16))
      } else {
        setReminder("")
      }
    }
  }, [open, task])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    onUpdate(task.id, {
      title: title.trim(),
      tags,
      reminder: reminder ? new Date(reminder) : undefined,
      color,
    })

    onOpenChange(false)
  }

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const taskColors = [
    { name: "Default", value: "bg-card" },
    { name: "Blue", value: "bg-blue-50" },
    { name: "Green", value: "bg-green-50" },
    { name: "Yellow", value: "bg-yellow-50" },
    { name: "Red", value: "bg-red-50" },
    { name: "Purple", value: "bg-purple-50" },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Task Title</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title..."
            />
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add tag..."
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
              />
              <Button type="button" onClick={addTag} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="ml-1 hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-reminder">Reminder</Label>
            <Input
              id="edit-reminder"
              type="datetime-local"
              value={reminder}
              onChange={(e) => setReminder(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2">
              {taskColors.map((taskColor) => (
                <button
                  key={taskColor.value}
                  type="button"
                  onClick={() => setColor(taskColor.value)}
                  className={`w-8 h-8 rounded border-2 ${taskColor.value} ${
                    color === taskColor.value ? "ring-2 ring-primary ring-offset-1" : "border-border"
                  }`}
                  title={taskColor.name}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              Save Changes
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
