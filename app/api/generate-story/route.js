export async function POST(req) {
  const { prompt } = await req.json()

  // Call your LLM API here to generate the story
  // This is a mock response
  const story = `Speaker 1: Alright so, instead of our regularly scheduled programming, there’s something hairier that came across my feed last night that I just need to discuss.
Speaker 2: Wait, where is this going? 
Speaker 1: I uh, I just thought we’d take a little... detour. You know, take the scenic route down the path of mystery. Specifically, into the thick, mossy woods where something like, oh I don’t know… *Bigfoot* himself might be lurking.
Speaker 2: Oh, for the love of, again, Briggs? Really? We did this last month. And the month before that. This is basically the podcast equivalent of your sad karaoke go-to.
Speaker 1: What? No! I’m just... providing the people what they want! Listen, There’s new evidence, and the public demands more attention on it.
Speaker 2: The “public” is just you, Briggs. You’re the one emailing us suggestions under fake names. We’ve all seen “Biggie O Footlore” in our inbox.`

  return Response.json({ story })
}
