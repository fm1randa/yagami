import { type Message, MessageMedia } from 'whatsapp-web.js'
import globalStates from './globalStates'
import { logger } from './helpers'

async function playAudio (message: Message, trigger: string) {
  const { audioCommandCollection } = globalStates
  if (audioCommandCollection === undefined) {
    logger.warn('Attempted to play audio but audioCommandCollection is undefined')
    message.reply('Could not play audio.')
    return
  }
  /**
   * Checks if there is no char after the trigger
   * @returns boolean
   */
  const isValidTrigger = () => {
    const triggerIndex = message.body.indexOf(trigger)
    const followingChar = message.body[triggerIndex + trigger.length]
    return followingChar !== undefined ? followingChar === ' ' : true
  }
  if (message.body.includes(trigger) && isValidTrigger()) {
    message.react('▶️')
    const audioFile = await audioCommandCollection.getAudioFile(trigger)
    message
      .reply(new MessageMedia('audio/mp3', audioFile), undefined, {
        sendAudioAsVoice: true
      })
      .then((message) =>
        logger.info(
          `Comando de áudio executado: ${trigger}. Mensagem: ${message.id._serialized}. Status: ${message.ack}`
        )
      )
      .catch((error) => logger.error('Erro ao enviar audio: ', error))
  }
}

async function handleAudioCommands (message: Message) {
  const { audioCommandCollection } = globalStates
  if (audioCommandCollection === undefined) {
    logger.warn('Attempted to play audio but audioCommandCollection is undefined')
    message.reply('Could not play audio.')
    return
  }
  try {
    if (message?.body === '' || typeof message.body !== 'string') return
    const triggers: string[] = await audioCommandCollection.getAllTriggers()
    triggers.forEach((trigger) => {
      playAudio(message, trigger)
    })
  } catch (error) {
    logger.error('Erro ao verificar comandos de áudio: ', error)
  }
}

export default handleAudioCommands
