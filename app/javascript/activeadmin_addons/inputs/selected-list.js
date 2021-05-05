var initializer = function() {
  setupSelectedList(document);

  $(document).on('has_many_add:after', function(event, container) {
    setupSelectedList(container);
  });

  function setupSelectedList(container) {
    $('.selected-list-input', container).each(function(i, el) {
      var element = $(el);
      var containerElement = element.closest('.selected-list-container');

      var url = element.data('url');
      var fields = element.data('fields');
      var predicate = element.data('predicate');
      var displayName = element.data('display-name');
      var method = element.data('method');
      var model = element.data('model');
      var prefix = model + '_' + method;
      var responseRoot = element.data('response-root');
      var minimumInputLength = element.data('minimum-input-length');
      var order = element.data('order');
      var allowDestroy = !!element.data('allow_destroy');

      var itemName = model + '[' + method + '][]';

      var selectedIds = function() {
        return $('input[name="' + itemName + '"]')
          .map(function(_, input) { return input.value.toString() })
          .toArray()
          .filter(function(v) { return v })
      }

      var selectOptions = {
        minimumInputLength: minimumInputLength,
        allowClear: true,
        ajax: {
          url: url,
          dataType: 'json',
          delay: 250,
          cache: true,
          data: function(params) {
            var textQuery = { m: 'or' };
            fields.forEach(function(field) {
              textQuery[field + '_' + predicate] = params.term;
            });

            var query = {
              order: order,
              q: {
                groupings: [textQuery],
                combinator: 'and',
              },
            };

            return query;
          },
          processResults: function(data) {
            if (data.constructor == Object) {
              data = data[responseRoot];
            }

            var ids = selectedIds()

            return {
              results: jQuery.map(data, function(resource) {
                return {
                  id: resource.id,
                  text: resource[displayName].toString(),
                  disabled: ids.includes(resource.id.toString())
                };
              }),
            };
          },
        },
      };

      element.on('select2:select', onItemSelected);
      element.on('select2:close', onSelectClosed);
      element.select2(selectOptions);

      containerElement.click(function(event) {
        var item = $(event.target);
        var className = allowDestroy ? 'selected-item' : 'selected-item--new'
        if (item.hasClass(className)) {
          item.remove();
        }
      });

      function onItemSelected(event) {
        var data = event.params.data;
        var selectedItemsContainer = $("[id='" + prefix + "_selected_values']");
        var itemId = prefix + '_' + data.id;

        if ($('#' + itemId).length > 0) {
          return;
        }

        var item = $('<div>' + data.text + '</div>').attr({
          class: 'selected-item selected-item--new',
          id: itemId,
        });

        var hiddenInput = $('<input>').attr({
          name: itemName,
          type: 'hidden',
          value: data.id,
        });

        item.appendTo(selectedItemsContainer);
        hiddenInput.appendTo(item);
      }

      function onSelectClosed() {
        $(el).val(null).trigger('change');
      }
    });
  }
};

$(initializer);
$(document).on('turbolinks:load', initializer);
