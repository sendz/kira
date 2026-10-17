/* main.js
 *
 * Copyright 2026 Sendy Aditya Suryana
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk?version=4.0';
import Adw from 'gi://Adw?version=1';

import { ScratchPadWindow } from './window.js';

pkg.initGettext();
pkg.initFormat();

export const ScratchPadApplication = GObject.registerClass(
    class ScratchPadApplication extends Adw.Application {
        constructor() {
            super({
                application_id: 'com.sendyyeah.ScratchPad',
                flags: Gio.ApplicationFlags.DEFAULT_FLAGS,
                resource_base_path: '/com/sendyyeah/ScratchPad'
            });

            const quit_action = new Gio.SimpleAction({name: 'quit'});
                quit_action.connect('activate', action => {
                this.quit();
            });
            this.add_action(quit_action);
            this.set_accels_for_action('app.quit', ['<control>q']);

            const show_about_action = new Gio.SimpleAction({name: 'about'});
            show_about_action.connect('activate', action => {
                const aboutParams = {
                    application_name: 'Scratch Pad',
                    application_icon: 'com.sendyyeah.ScratchPad',
                    developer_name: 'Sendy Aditya Suryana',
                    version: '0.1.0',
                    developers: [
                        'Sendy Aditya Suryana'
                    ],
                    // Translators: Replace "translator-credits" with your name/username, and optionally an email or URL.
                    translator_credits: _("translator-credits"),
                    copyright: '© 2026 Sendy Aditya Suryana'
                };
                const aboutDialog = new Adw.AboutDialog(aboutParams);
                aboutDialog.present(this.active_window);
            });

            this.add_action(show_about_action);

            const new_file_action = new Gio.SimpleAction({ name: 'new' });
            new_file_action.connect('activate', () => {
                this.active_window?.newFile();
            })
            this.add_action(new_file_action);
            this.set_accels_for_action('app.new', ['<control>n']);

            const open_action = new Gio.SimpleAction({ name: 'open' });
            open_action.connect('activate', () => {
                this.active_window?.openFile();
            });
            this.add_action(open_action);
            this.set_accels_for_action('app.open', ['<control>o']);

            const save_action = new Gio.SimpleAction({ name: 'save' });
            save_action.connect('activate', () => {
                this.active_window?.saveFile();
            });
            this.add_action(save_action);
            this.set_accels_for_action('app.save', ['<control>s']);

            const save_as_action = new Gio.SimpleAction({ name: 'save-as' });
            save_as_action.connect('activate', () => {
                this.active_window?.saveFileAs();
            });
            this.add_action(save_as_action);
            this.set_accels_for_action('app.save-as', ['<control><shift>s']);
        }

        vfunc_activate() {
            let {active_window} = this;

            if (!active_window)
                active_window = new ScratchPadWindow(this);

            active_window.present();
        }
    }
);

export function main(argv) {
    const application = new ScratchPadApplication();
    return application.runAsync(argv);
}
