var
  kind = require('enyo/kind'),
  Panel = require('moonstone/Panel'),
  FittableColumns = require('layout/FittableColumns'),
  BodyText = require('moonstone/BodyText'),
  LunaService = require('enyo-webos/LunaService'),
	Divider = require('moonstone/Divider'),
	Scroller = require('moonstone/Scroller'),
  Item = require('moonstone/Item'),
	ToggleItem = require('moonstone/ToggleItem');

var scriptPath = "/media/developer/apps/usr/palm/applications/org.webosbrew.bluetooth-disabler/assets/disable-bluetooth.sh";
var linkPath = "/var/lib/webosbrew/init.d/99-bluetooth-disabler";

module.exports = kind({
  name: 'MainPanel',
  kind: Panel,
  title: 'webOS Bluetooth Disabler',
  titleBelow: "webosbrew.org",
  headerType: 'medium',
  components: [
    {components: [
      {kind: Divider, name: 'status', content: 'Bluetooth service status: unknown'},
    ]},
    {kind: FittableColumns, classes: 'enyo-center', fit: true, components: [
      {kind: Scroller, fit: true, components: [
        {classes: 'moon-hspacing', controlClasses: 'moon-12h', components: [
          {components: [
            {kind: BodyText, content: "Disabling Bluetooth removes 'Magic' part of Remote Controller!" },
            {kind: BodyText, content: "Only IR functions will work after disabling Bluetooth." },
            {kind: BodyText, content: "On the other hand - no more unwanted Bluetooth connection requests!" },
            {kind: Item, name: 'btnEnable', content: 'Enable Bluetooth', ontap: "enableBluetooth", disabled: true },
            {kind: Item, name: 'btnDisable', content: 'Disable Bluetooth', ontap: "disableBluetooth", disabled: true },
            {kind: ToggleItem, name: "autostart", content: 'Disable on boot', checked: false, disabled: true, onchange: "autostartToggle"},
          ]},
        ]},
      ]},
    ]},
    {kind: LunaService, name: 'rootCheck', service: 'luna://org.webosbrew.hbchannel.service', method: 'getConfiguration', onResponse: 'onRootSuccess', onError: 'onRootFail'},
    {kind: LunaService, name: 'autostartStatusCheck', service: 'luna://org.webosbrew.hbchannel.service', method: 'exec', onResponse: 'onAutostartStatusCheck', onError: 'onAutostartStatusCheck'},
    {kind: LunaService, name: 'serviceCheck', service: 'luna://org.webosbrew.hbchannel.service', method: 'exec', onResponse: 'setStatus', onError: 'setStatus'},
    {kind: LunaService, name: 'exec', service: 'luna://org.webosbrew.hbchannel.service', method: 'exec', onResponse: 'getStatus', onError: 'getStatus'},
  ],

  bindings: [],

  create: function () {
    this.inherited(arguments);
    this.$.rootCheck.send();
  },

  onRootSuccess: function () {

    this.$.autostartStatusCheck.send({ command: 'readlink ' + linkPath });
    this.getStatus();
  },

  onRootFail: function () {
    this.$.status.set('content', 'Root check failed! Is Homebrew Channel installed and rooted?')
  },

  getStatus: function () {
    this.$.serviceCheck.send({ command: 'systemctl status webos-bluetooth-service.service | sed -n "s/^.*Active:\\s\\(\\S*\\).*$/\\1/p"' });
  },

  setStatus: function (sender, evt) {
    var receivedStatus = evt.stdoutString.trim();
    this.$.status.set('content', 'Bluetooth service status: ' + receivedStatus)

    if (receivedStatus === 'inactive'){
      this.$.btnEnable.set('disabled', false);
      this.$.btnDisable.set('disabled', true);
    }
    else {
      this.$.btnEnable.set('disabled', true);
      this.$.btnDisable.set('disabled', false);
    }
  },

  enableBluetooth: function () {
    this.$.exec.send({ command: "systemctl start webos-bluetooth-service.service" }); 
  },

  disableBluetooth: function () {
    this.$.exec.send({ command: "systemctl stop webos-bluetooth-service.service" }); 
  },

  onAutostartStatusCheck: function (sender, evt) {
    this.$.autostart.set('disabled', false);

    if (evt.stdoutString)
      this.$.autostart.set('checked', true);
  },

  autostartToggle: function () {
    if (this.$.autostart.checked) {
      this.$.exec.send({ command: 'mkdir -p /var/lib/webosbrew/init.d && ln -sf ' + scriptPath + ' ' + linkPath });
    } else {
      this.$.exec.send({ command: 'rm -rf ' + linkPath });
    }
  },
});
