'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Star, MessageSquare, User, ThumbsUp } from 'lucide-react'
import { open as openEmbed } from '@play-ai/web-embed'
import { toast } from 'sonner'

const webEmbedId = process.env.NEXT_PUBLIC_WEB_EMBED_ID || ''

const formFields = [
  {
    key: 'name',
    label: 'Name',
    type: 'text',
    argType: 'string',
    icon: User,
    required: true,
  },
  {
    key: 'stars_1_to_5',
    label: 'Star Rating (1-5)',
    type: 'text',
    argType: 'number',
    icon: Star,
    required: true,
    validate: (value) => {
      const num = Number(value)
      return num >= 1 && num <= 5
    },
  },
  {
    key: 'review',
    label: 'Leave a review!',
    type: 'textarea',
    argType: 'string',
    icon: MessageSquare,
    required: true,
    minLength: 10,
  },
  {
    key: 'come_back',
    label: 'Would you come back?',
    type: 'checkbox',
    argType: 'boolean',
    icon: ThumbsUp,
  },
]

export default function FeedbackForm() {
  const [formValues, setFormValues] = useState({})
  const [showSuccess, setShowSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const initializeFormValues = useCallback(() => {
    const initialFormValues = {}
    formFields.forEach((field) => {
      initialFormValues[field.key] = {
        value: field.type === 'checkbox' ? false : '',
        error: null,
      }
    })
    setFormValues(initialFormValues)
  }, [])

  useEffect(() => {
    initializeFormValues()
  }, [initializeFormValues])

  const validateForm = () => {
    let isValid = true
    const newFormValues = { ...formValues }

    formFields.forEach((field) => {
      const value = formValues[field.key]?.value
      let error = null

      if (field.required && !value) {
        error = 'This field is required'
      } else if (field.validate && !field.validate(value)) {
        error = 'Invalid value'
      } else if (field.minLength && value.length < field.minLength) {
        error = `Minimum ${field.minLength} characters required`
      }

      newFormValues[field.key] = { ...newFormValues[field.key], error }
      if (error) isValid = false
    })

    setFormValues(newFormValues)
    return isValid
  }

  const handleFieldChange = (key, value) => {
    setFormValues((prev) => ({
      ...prev,
      [key]: { value, error: null },
    }))
  }

  const events = [
    {
      name: 'update-form-field',
      when: 'The user gives a value for a form field',
      data: {
        key: { type: 'string', description: 'The form field to update' },
        type: { type: 'string', description: 'The type of the form field' },
        stringValue: { type: 'string', description: 'String value' },
        numberValue: { type: 'number', description: 'Number value' },
        booleanValue: { type: 'boolean', description: 'Boolean value' },
      },
    },
    {
      name: 'submit-form',
      when: 'The user wants to submit the form',
      data: {},
    },
  ]

  const onEvent = useCallback((event) => {
    if (event.name === 'update-form-field') {
      const value = event.data[`${event.data.type}Value`]
      handleFieldChange(event.data.key, value)
    } else if (event.name === 'submit-form') {
      handleSubmit()
    }
  }, [])

  useEffect(() => {
    if (webEmbedId) {
      openEmbed(webEmbedId, {
        events,
        onEvent,
        prompt: `This form is for feedback submission. Fields: ${formFields
          .map((field) => `${field.key} (${field.argType})`)
          .join(
            ', '
          )}. Update fields immediately after user input. Submit when done.`,
      })
    }
  }, [onEvent])

  const handleSubmit = async () => {
    if (!validateForm() || isSubmitting) return

    setIsSubmitting(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      console.log('Feedback submitted:', formValues)
      setShowSuccess(true)
      toast.success('Thank you for your feedback!')
      setTimeout(() => {
        setShowSuccess(false)
        initializeFormValues()
      }, 3000)
    } catch (error) {
      toast.error('Failed to submit feedback. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderField = (field) => {
    if (!formValues[field.key]) return null

    const Icon = field.icon
    const commonProps = {
      id: field.key,
      name: field.key,
      value: formValues[field.key]?.value,
      onChange: (e) => handleFieldChange(field.key, e.target.value),
      className: `mt-1 block w-full bg-[#334155]/50 border-[#475569] text-white placeholder-gray-400 text-lg pl-10 ${
        formValues[field.key]?.error ? 'border-red-500' : ''
      }`,
    }

    return (
      <div key={field.key}>
        <label
          htmlFor={field.key}
          className='block text-lg font-medium text-gray-300 mb-2'
        >
          {field.label}
          {field.required && <span className='text-red-500 ml-1'>*</span>}
        </label>
        <div className='relative'>
          {field.type === 'textarea' ? (
            <Textarea
              {...commonProps}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              placeholder={`Enter your ${field.label.toLowerCase()}...`}
              rows={4}
              className={`${commonProps.className} pt-2`}
            />
          ) : field.type === 'checkbox' ? (
            <div className='flex items-center gap-2'>
              <input
                type='checkbox'
                id={field.key}
                name={field.key}
                checked={formValues[field.key]?.value}
                onChange={(e) => handleFieldChange(field.key, e.target.checked)}
                className='w-4 h-4 text-orange-500 bg-[#334155]/50 border-[#475569] rounded focus:ring-orange-500'
              />
              <label htmlFor={field.key}>{field.label}</label>
            </div>
          ) : (
            <Input
              {...commonProps}
              type={field.type}
              placeholder={field.label}
            />
          )}
          <Icon className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
        </div>
        {formValues[field.key]?.error && (
          <p className='mt-1 text-sm text-red-500'>
            {formValues[field.key].error}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-b from-[#0f172a] to-[#1e293b] py-12 px-4 sm:px-6 lg:px-8 flex'>
      <Card className='w-full max-w-2xl bg-[#1e293b]/80 backdrop-blur-md border-[#334155] shadow-xl'>
        <CardHeader>
          <CardTitle className='text-4xl font-bold text-center text-orange-500'>
            AI Voice-Assisted Review Form
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className='space-y-6' onSubmit={(e) => e.preventDefault()}>
            {formFields.map(renderField)}
            <Button
              type='submit'
              className='w-full bg-orange-500 hover:bg-orange-600 text-white text-lg py-6 disabled:opacity-50'
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </form>
          {showSuccess && (
            <div className='mt-4 p-4 bg-green-500/20 border border-green-500/50 rounded-lg'>
              <p className='text-green-400 text-center'>
                Thank you for your feedback!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
