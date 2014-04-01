Ext.define('DMPlanner.controller.Questions', {
    extend: 'Ext.app.Controller',
    requires: ['Ext.tab.Panel','DMPlanner.util.UUID'],

    stores : [//
        'Plans'//
    ],
    views: ['QuestionsForm', 'SectionList', 'Section'],

    refs: [{
        ref: 'container',
        selector: '#sectionContainer'
    }, {
        ref: 'form',
        selector: 'questions'
    }, {
        ref: 'sections',
        selector: 'sectionlist'
    }],

    init: function(application) {
        this.control({
            sectionlist: {
                select: this.showSection
            },
            '#sectionNext' : {
                click : this.showNextSection
            },
            '#sectionPrev' : {
                click : this.showPrevSection
            },
            'sectionpanel>component': {
                sectiondatachanged: this.onSectionDataChanged
            },
             /*'#planFinish' : {
             click : this.finishPlsn
             },*/

             'questions field, questions htmleditor' : {
                change : this.saveItem
             }
        });

        /*this.listen({
         store : {
         '#Sections' : {
         baz : this.onStore
         }
         }
         });*/
    },

    /**
     * Fired when any updates are made to a Section's data.
     * @param {String} sectionId
     * @param {String} planId
     * @param {Array} Array of all data records for this section.
     */
    onSectionDataChanged: function(sectionId, planId, data) {
        var section = this.getPlansStore().getById(planId).sections().getById(sectionId);

        section.set('data', data);

    },

    showSection: function(grid, record, index) {
        //@format:off
        var groups = record.groups(),
            cont = this.getContainer(),
            bbar = cont.down('toolbar#bottomNavBar'),
            config = record.get('config'),
            count = grid.getStore().getCount(),
            isLastSection = (count - index) === 1,
            isFirstSection = (count - index) === count,
            buttons = [],
            questions;
        //@format:on

        cont.removeAll();
        bbar.removeAll();

        //check for config
        if (Ext.isObject(config)) {
            //do config stuff, add sectionId(itemId), planId
            clone = Ext.clone(config);
            Ext.applyIf(clone, {
                itemId: record.getId(),
                planId: record.get('planId'),
                data: record.get('data')//,
                //header: record.get('title') ? undefined : false
            });
            questions = clone;

        } else if (groups.count() > 0) {
            //create questions form
            questions = {
                xtype: 'questions',
                bodyPadding: 20,
                flex: 1,
                width: '100%',
                title: record.get('name'),
                items: this.getGroupQuestions(groups) //get an array of fieldsets
            };

        }

        if (!!questions) {
            cont.add(questions);
        }

        if(!isFirstSection){
            buttons.push({
                xtype : 'button',
                text : 'Previous',
                itemId : 'sectionPrev',
                glyph: 'xf060@FontAwesome'
            });
        }

        buttons.push({
            xtype : 'button',
            text : isLastSection ? 'Finished' : 'Next',
            itemId : isLastSection ? 'planFinish' : 'sectionNext',
            glyph : isLastSection ? 'xf164@FontAwesome' : 'xf061@FontAwesome',
            iconAlign: 'right'
        });

        bbar.add(buttons);

    },

    getGroupQuestions: function(groups) {
        var fieldsets = [],
            grouped, createTab, createFields;

        createTab = function(fields, title, width) {
            return {
                xtype : 'fieldcontainer',
                title : title,
                width : width || 600,
                defaults : {
                    anchor : '100%'
                },
                layout : 'anchor',
                items : fields
            };
        };

        createFields = function(group) {
            var fields = [];

            group.questions().each(function(question) {
                var info = question.get('guidance'), field = Ext.apply({
                    fieldLabel : question.get('question'),
                    value : question.get('answer') || question.get('defAnswer'),
                    question : question,
                    anchor : '100%',
                    xtype : 'textfield',
                    afterLabelTextTpl : !!info ? '<span class="fa dmp-icon-guidance sup" data-qtip="' + info + '">&#xf059;</span>' : undefined,
                    //afterSubTpl: !!info ? '<span class="dmp-icon-guidance"
                    // data-qtip="' + info + '">?</span>' : undefined,
                    //afterBodyEl: !!info ? '<span class="dmp-icon-guidance"
                    // data-qtip="' + info + '">?</span>' : undefined,
                    //msgTarget         : 'side',
                    labelAttrTpl : 'data-qtip="' + info + '"'
                }, question.get('config'));

                fields.push(field);
            });

            return fields;
        };

        groups.group('index', 'ASC');
        grouped = groups.getGroups();

        Ext.each(grouped, function(g){
            var children = g.children,
                repeat = !!children[0].get('repeatable'),
                tabs;

            tabs = !repeat ? undefined : {
                xtype: 'tabpanel',
                //width: 500,
                //height: 400,
                plain: true,
                bodyPadding: 15,
                bodyCls: 'dmp-group-tab',
                defaults: {
                    closable: false
                },
                dockedItems: [{
                    xtype: 'toolbar',
                    dock: 'right',
                    cls: 'dmp-group-toolbar',
                    items: [{
                        xtype: 'button',
                        tooltip: 'Add',
                        glyph: 'xf067@FontAwesome',
                        //text: '+',
                        handler: function(b) {
                            var tabs = b.up('tabpanel'),
                                pos = tabs.items.length + 1,
                                uuid = DMPlanner.util.UUID.uuid,
                                groupId = uuid(),
                                template= tabs.groupTemplate,
                                store = Ext.getStore('Plans').getById(template.planId).sections().getById(template.sectionId).groups(),
                                insTab;

                            template.id = groupId;
                            Ext.each(template.questions, function(q){
                                q.id = uuid();
                                q.groupId = groupId;
                                q.answer = q.defAnswer;
                            });

                            store.loadRawData(template, true);

                            insTab = createTab(
                                createFields(store.getById(groupId)),
                                Ext.String.format('{0} {1}',template.name, tabs.items.length + 1),
                                template.width
                            );
                            tabs.setActiveTab(tabs.add(insTab));
                        }
                    }, {
                        xtype: 'button',
                        //text: 'x',
                        glyph: 'xf00d@FontAwesome',
                        tooltip: 'Remove',
                        handler: function(b) {
                            var tabs = b.up('tabpanel'),
                                remTab = tabs.getActiveTab(),
                                template= tabs.groupTemplate,
                                store = Ext.getStore('Plans').getById(template.planId).sections().getById(template.sectionId).groups(),
                                groupId = remTab.down('field[question]').question.get('groupId');

                            store.remove(store.getById(groupId));
                            tabs.remove(remTab);
                        }
                    }]
                }],
                items: []
            };

            Ext.each(children, function(group, idx) {
                var fields = createFields(group);

                if(repeat) {
                    //set the index based on order of appearance
                    group.set('repeatIdx', idx);

                    //set the template for new groups
                    if(idx === 0) {
                        tabs.groupTemplate = Ext.clone(group.raw);
                        console.info(tabs.groupTemplate);
                    }

                    tabs.items.push(createTab(fields,
                        Ext.String.format('{0} {1}',group.get('name'), group.get('repeatIdx') + 1),
                        group.get('width')
                    ));
                }else {
                    fieldsets.push({
                        xtype : 'fieldset',
                        title : group.get('name'),
                        items : fields,
                        maxWidth : group.get('width') || 600,
                        width : '100%'
                    });
                }
            });

            fieldsets.push(tabs);
        });

        return fieldsets;
    },
     showNextSection: function() {
         var grid = this.getSections(),
             store = grid.getStore(),
             selModel = grid.getSelectionModel(),
             selected = selModel.getLastSelected(),
             curIndex = store.indexOf(selected),
             next = store.getAt(curIndex + 1);

         if (next) {
            selModel.select([next]);
         }
     },
     showPrevSection: function() {
         var grid = this.getSections(),
             store = grid.getStore(),
             selModel = grid.getSelectionModel(),
             selected = selModel.getLastSelected(),
             curIndex = store.indexOf(selected),
             prev = store.getAt(curIndex - 1);

         if (prev) {
            selModel.select([prev]);
         }
     },

     /*finishSurvey : function() {
     var groups = this.getGroups();
     this.getForm().removeAll();
     groups.getSelectionModel().deselectAll();
     groups.hide();
     groups.up().down('surveylist').getSelectionModel().deselectAll();

     },*/

    saveItem : function(field) {
        var question = field.question;

        if (!question) {
            field = field.up('[question]');
            question = field.question;
        }

        if (question) {
            question.set('answer', field.getValue());
        }
    }

});
