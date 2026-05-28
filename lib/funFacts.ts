const FACTS = [
  "🚨 In Singapore, running a red light carries a fine of up to S$5,000 and 12 months jail for first offenders.",
  "🚗 Singapore has one of the safest road networks in Asia — less than 1.8 deaths per 100,000 people.",
  "⚠️ Tailgating is a factor in over 30% of expressway accidents in Singapore.",
  "🛑 A stop sign means come to a complete halt — even if you can see no traffic.",
  "📱 Using a mobile phone while driving (even hands-free if distracted) can cost you 12 demerit points.",
  "🏎️ Speed limits exist because reaction time at 80km/h means you travel 22m before braking begins.",
  "🚦 Yellow box junctions: you must not enter unless your exit is clear.",
  "🌧️ Wet roads can increase stopping distance by up to 3×.",
  "🔆 Headlights must be on from 7pm to 7am — and in heavy rain regardless of time.",
  "🦺 Every 10km/h over the speed limit roughly doubles your accident risk.",
  "🛣️ Expressway minimum speed is 50km/h — driving too slowly is also dangerous.",
  "↔️ Change lanes only when safe — always signal at least 3 seconds before moving.",
  "🚶 Pedestrians at zebra crossings have right of way — you must stop for them.",
  "🔄 At a roundabout, traffic already in the roundabout has priority.",
  "🏍️ Motorcycles are 18× more likely to be in a fatal crash than car drivers per km travelled.",
]

export function getRandomFact(): string {
  return FACTS[Math.floor(Math.random() * FACTS.length)]
}
