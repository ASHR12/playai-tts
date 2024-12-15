'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Star, MessageSquare, User, ThumbsUp } from 'lucide-react'
import { open as openEmbed } from '@play-ai/web-embed'

// Replace with your web embed ID
const webEmbedId = ''

export default function FeedbackForm() {
  const formFields = [
    {
      key: 'name',
      label: 'Name',
      type: 'text',
      argType: 'string',
      icon: User,
    },
    {
      key: 'stars_1_to_5',
      label: 'Star Rating (1-5)',
      type: 'text',
      argType: 'number',
      icon: Star,
    },
    {
      key: 'review',
      label: 'Leave a review!',
      type: 'textarea',
      argType: 'string',
      icon: MessageSquare,
    },
    {
      key: 'come_back',
      label: 'Would you come back?',
      type: 'checkbox',
      argType: 'boolean',
      icon: ThumbsUp,
    },
  ]

  const [formValues, setFormValues] = useState({})
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    const initialFormValues = {}
    formFields.forEach((field) => {
      if (field.type === 'text' || field.type === 'textarea') {
        initialFormValues[field.key] = { value: '' }
      } else if (field.type === 'checkbox') {
        initialFormValues[field.key] = { value: false }
      }
    })
    setFormValues(initialFormValues)
  }, [])

  const events = [
    {
      name: 'update-form-field',
      when: `The user gives a value for a form field`,
      data: {
        key: { type: 'string', description: 'The form field to update' },
        type: {
          type: 'string',
          description:
            'The type of the form field (string, number, or boolean)',
        },
        stringValue: {
          type: 'string',
          description:
            "The value to update the form field with, if it's a string value",
        },
        numberValue: {
          type: 'number',
          description:
            "The value to update the form field with, if it's a number value",
        },
        booleanValue: {
          type: 'boolean',
          description:
            "The value to update the form field with, if it's a boolean value",
        },
      },
    },
    {
      name: 'submit-form',
      when: `The user wants to submit the form or says they are done`,
      data: {}, // No additional data needed for submission
    },
  ]

  const prompt = `This form is for feedback submission. Here is a list of form fields: ${formFields
    .map((field) => `${field.key} (${field.argType})`)
    .join(
      ', '
    )}. Call "update-form-field" IMMEDIATELY after each value is given by the user for the form field , don't ask until it's updated. When the user wants to submit the form or indicates they are done, call "submit-form".`

  const onEvent = (event) => {
    console.log('onEvent: ', event)
    if (event.name === 'update-form-field') {
      let value = ''
      switch (event.data.type) {
        case 'string':
          value = event.data.stringValue
          break
        case 'number':
          value = event.data.numberValue
          break
        case 'boolean':
          value = event.data.booleanValue
          break
      }

      setFormValues((oldFormValues) => ({
        ...oldFormValues,
        [event.data.key]: { value },
      }))
    } else if (event.name === 'submit-form') {
      // Handle form submission
      console.log('Feedback submitted:', formValues)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 5000)
    }
  }

  useEffect(() => {
    openEmbed(webEmbedId, {
      events,
      onEvent,
      prompt,
    })
  }, [])

  const handleSubmitClick = () => {
    console.log('Feedback submitted:', formValues)
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)
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
          <form className='space-y-6'>
            {formFields.map((field) => {
              if (!formValues[field.key]) {
                return null
              }

              const label = (
                <label
                  htmlFor={field.key}
                  className='block text-lg font-medium text-gray-300 mb-2'
                >
                  {field.label}
                </label>
              )

              const Icon = field.icon

              switch (field.type) {
                case 'text':
                  return (
                    <div key={field.key}>
                      {label}
                      <div className='relative'>
                        <Input
                          type='text'
                          id={field.key}
                          name={field.key}
                          value={formValues[field.key]?.value}
                          onChange={(e) => {
                            setFormValues({
                              ...formValues,
                              [field.key]: { value: e.target.value },
                            })
                          }}
                          className='mt-1 block w-full bg-[#334155]/50 border-[#475569] text-white placeholder-gray-400 text-lg pl-10'
                          placeholder={field.label}
                        />
                        <Icon className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
                      </div>
                    </div>
                  )
                case 'textarea':
                  return (
                    <div key={field.key}>
                      {label}
                      <div className='relative'>
                        <Textarea
                          id={field.key}
                          name={field.key}
                          value={formValues[field.key]?.value}
                          onChange={(e) => {
                            setFormValues({
                              ...formValues,
                              [field.key]: { value: e.target.value },
                            })
                          }}
                          className='mt-1 block w-full bg-[#334155]/50 border-[#475569] text-white placeholder-gray-400 text-lg pl-10 pt-2'
                          placeholder={`Enter your ${field.label.toLowerCase()}...`}
                          rows={4}
                        />
                        <Icon className='absolute left-3 top-3 text-gray-400 w-5 h-5' />
                      </div>
                    </div>
                  )
                case 'checkbox':
                  return (
                    <div key={field.key} className='flex items-center gap-2'>
                      <input
                        type='checkbox'
                        id={field.key}
                        name={field.key}
                        checked={formValues[field.key]?.value}
                        onChange={(e) => {
                          setFormValues({
                            ...formValues,
                            [field.key]: { value: e.target.checked },
                          })
                        }}
                        className='w-4 h-4 text-orange-500 bg-[#334155]/50 border-[#475569] rounded focus:ring-orange-500'
                      />
                      {label}
                    </div>
                  )
              }
            })}
            <Button
              type='button'
              className='w-full bg-orange-500 hover:bg-orange-600 text-white text-lg py-6'
              onClick={handleSubmitClick}
            >
              Submit Feedback
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
