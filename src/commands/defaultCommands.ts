import AudioCommandActionSet from '../actionSets/AudioCommandActionSet';
import AdminActionSet from '../actionSets/AdminActionSet';
import Command from '../Command';
import addFirstAdmin from './addFirstAdmin';

export default function getDefaultCommands() {
  const adminActionSet = new AdminActionSet();
  const audioCommandActionSet = new AudioCommandActionSet();

  return [
    addFirstAdmin,
    new Command('List admins', {
      trigger: {
        mainCheckRule: 'exactly',
        mainText: '!admins'
      },
      action: adminActionSet.listAdmins,
      restricted: true,
      help: 'Lists all the administrators that were added with the !addadmin command',
      countAsCommandExecuted: false
    }),
    new Command('Add admin', {
      trigger: {
        mainCheckRule: 'exactly',
        mainText: '!addadm'
      },
      action: adminActionSet.addAdmin,
      restricted: true,
      help: 'Allows a contact to use the commands that are restricted.',
      countAsCommandExecuted: false
    }),
    new Command('Remove admin', {
      trigger: {
        mainCheckRule: 'exactly',
        mainText: '!rmadm'
      },
      action: adminActionSet.removeAdmin,
      restricted: true,
      help: 'Removes the administrator rights from a contact.',
      countAsCommandExecuted: false
    }),
    new Command('Lista os comandos de áudio', {
      trigger: {
        mainCheckRule: 'exactly',
        mainText: '!audios'
      },
      action: audioCommandActionSet.listAudioCommands,
      restricted: true,
      help: 'Mostra todos os comandos de áudio que foram adicionados ao bot com o comando !addaudio',
      countAsCommandExecuted: false
    }),
    new Command('Adiciona um comando de áudio', {
      trigger: {
        mainCheckRule: 'startsWith',
        mainText: '!addaudio'
      },
      action: audioCommandActionSet.addAudioCommand,
      restricted: true,
      help: '!addaudio <comando> <nome do arquivo>\n\nExemplo: !addaudio !abelha abelha.mpeg\n\nO comando deve começar com !',
      countAsCommandExecuted: false
    }),
    new Command('Remove um comando de áudio', {
      trigger: {
        mainCheckRule: 'startsWith',
        mainText: '!rmaudio'
      },
      action: audioCommandActionSet.removeAudioCommand,
      restricted: true,
      help: '!rmaudio <comando>\n\nExemplo: !rmaudio !abelha',
      countAsCommandExecuted: false
    })
  ];
}
