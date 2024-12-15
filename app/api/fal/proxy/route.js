import { route } from '@fal-ai/server-proxy/nextjs'

export const POST = (req) => {
  // this is a great place to add debug logging if you run into issues connecting to the fal proxy
  // console.log("POST request received", req)
  return route.POST(req)
}

export const GET = route.GET
