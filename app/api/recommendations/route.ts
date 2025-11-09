import { NextResponse } from "next/server"
import Cerebras from '@cerebras/cerebras_cloud_sdk'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { weather, traffic, busDelay, time } = body

    const apiKey = process.env.CEREBRAS_API_KEY
    const missingKeyFallback = {
      ru: `Температура ${weather?.temp || 0}°C, пробки ${traffic?.congestion || 0}%. Рекомендуем выехать чуть раньше и следить за обновлениями трафика.`,
      kz: `Температура ${weather?.temp || 0}°C, жол тығындары ${traffic?.congestion || 0}%. Сәл ертерек шыққан дұрыс және трафик жаңартуларын қадағалаңыз.`,
    }

    if (!apiKey) {
      return NextResponse.json({ recommendation: missingKeyFallback })
    }

    const cerebras = new Cerebras({ apiKey })

    const systemPrompt = `Ты — умный городской ассистент для жителей Актау, Казахстан.

ПРАВИЛА:
1. Отвечай СТРОГО в чистом JSON без markdown кодовых блоков
2. Формат: {"ru": "текст на русском", "kz": "текст на казахском"}
3. Каждая рекомендация 2-4 предложения, дружелюбный тон
4. Учитывай время суток, погоду, пробки
5. Давай практичные советы: как одеться, когда выезжать, какой транспорт
6. Упоминай конкретные цифры
7. Казахский перевод естественный, не дословный

ДАННЫЕ:
Погода: ${weather?.temp || 0}°C, ${weather?.condition || 'ясно'}
Пробки: ${traffic?.congestion || 0}% загруженность
Автобусы: задержка ~${busDelay || 0} мин
Время: ${time || 'день'}

Пример ответа:
{"ru": "Температура +5°C, пробки 12%. Одевайтесь тепло, легкая куртка подойдет. Дороги относительно свободны.", "kz": "Температура +5°C, жол тығындары 12%. Жылы киініңіз, жеңіл куртка жарайды. Жолдар салыстырмалы түрде бос."}

ВАЖНО: ТОЛЬКО JSON, БЕЗ \`\`\`json\`\`\` БЛОКОВ!`

    const response = await cerebras.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Дай краткую рекомендацию на основе данных." }
      ],
      model: 'llama-3.3-70b',
      stream: false,
      max_completion_tokens: 1024,
      temperature: 0.8,
      top_p: 0.95,
    }) as any

    let content = (response.choices?.[0]?.message?.content || '{}').trim()
    
    console.log('[AI Recommendations] Raw response:', content)
    
    let parsed
    try {
      content = content.replace(/^```json\s*/i, '').replace(/\s*```$/i, '')
      
      const jsonMatch = content.match(/\{[^{}]*"ru"[^{}]*"kz"[^{}]*\}/i)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0])
      } else {
        parsed = JSON.parse(content)
      }
      
      if (!parsed.ru || !parsed.kz) {
        throw new Error('Missing ru or kz keys')
      }
      
      console.log('[AI Recommendations] Parsed:', parsed)
    } catch (e) {
      console.error('[AI Recommendations] Parse failed:', e)
      parsed = { 
        ru: `Температура ${weather?.temp || 0}°C, пробки ${traffic?.congestion || 0}%. Хорошего дня! Следите за обновлениями трафика.`, 
        kz: `Температура ${weather?.temp || 0}°C, жол тығындары ${traffic?.congestion || 0}%. Жақсы күн болсын! Трафик жаңартуларын қадағалаңыз.` 
      }
    }

    return NextResponse.json({ recommendation: parsed })
  } catch (e: any) {
    return NextResponse.json({ 
      recommendation: { 
        ru: "Не удалось получить рекомендацию. Попробуйте позже.", 
        kz: "Ұсынысты алу мүмкін болмады. Кейінірек қайталап көріңіз." 
      } 
    }, { status: 500 })
  }
}
