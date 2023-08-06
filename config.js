import { Regex } from '@companion-module/base'

export const ConfigFields = [
    {
        type: 'textinput',
        id: 'host',
        label: 'Target IP',
        width: 6,
        regex: Regex.IP,
    },
    {
        type: 'textinput',
        id: 'port',
        label: 'Target Port',
        width: 3,
        default: 23,
        regex: Regex.PORT,
    },
    {
        type: 'dropdown',
        id: 'model',
        label: 'Crestron Model',
        width: 6,
        default: '8',
        choices: [
            { id: '8', label: 'DM-MD8x8' },
            { id: '16', label: 'DM-MD16x16' },
            { id: '32', label: 'DM-MD32x32' }
        ],
    },
    {
        type: 'checkbox',
        label: 'Authentication',
        id: 'authentication',
        default: false
    },
    {
        type: 'textinput',
        id: 'username',
        label: 'Username',
        width: 6,
        default: '',
        isVisible: (configValues) => configValues.authentication === true,
    },
    {
        type: 'textinput',
        id: 'password',
        label: 'Password',
        width: 6,
        default: '',
        isVisible: (configValues) => configValues.authentication === true,
    },
]
