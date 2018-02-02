import { assert } from "chai";
import { mount } from "@vue/test-utils";
import ImageUpload from "../src/components/ImageUpload";
import sinon from "sinon";
import sinonStubPromise from "sinon-stub-promise";
import moxios from "moxios";

sinonStubPromise(sinon);

describe("Deleting or clearing the last uploaded image", () => {
  let component;

  beforeEach(() => {
    component = mount(ImageUpload, {
      propsData: {
        uploadUrl: "/test/upload/url",
        initialSrc: "server_confirmed.jpg"
      }
    });
    component.setMethods({
      getPreview: sinon
        .stub()
        .returnsPromise()
        .resolves(null)
    });
    moxios.install();
  });

  afterEach(() => {
    moxios.uninstall();
  });

  it("has an button to delete the image", () => {
    assert.isTrue(component.contains(".delete-btn"));
  });

  it("the delete button is only shown if a delete url prop is supplied", () => {
    const button = component.find(".delete-btn");
    assert.equal("none", button.element.style.display);

    component.setProps({ deleteUrl: "/test/delete/url" });
    assert.notEqual("none", button.element.style.display);
  });

  it("sends an axios delete request when clicked to delete url", done => {
    component.setProps({ deleteUrl: "/test/delete/url" });

    const button = component.find(".delete-btn");
    button.trigger("click");

    moxios.wait(() => {
      let request = moxios.requests.mostRecent();
      assert.equal("delete", request.config.method);
      assert.equal("/test/delete/url", request.config.url);
      done();
    });
  });

  it("emits an event if the image is successfully deleted", done => {
    component.setProps({ deleteUrl: "/test/delete/url" });

    moxios.stubRequest("/test/delete/url", { status: 200 });

    const button = component.find(".delete-btn");
    button.trigger("click");

    moxios.wait(() => {
      const event = component.emitted()["image-deleted"];
      assert.exists(event);
      done();
    });
  });

  it("resets the preview after a successful deletion", done => {
    component.setProps({ deleteUrl: "/test/delete/url" });

    moxios.stubRequest("/test/delete/url", { status: 200 });

    const button = component.find(".delete-btn");
    button.trigger("click");

    moxios.wait(() => {
      const img = component.find("img.preview");
      assert.equal(component.vm.default_src, img.element.src);
      done();
    });
  });

  it("emits an event if the delete request fails", done => {
    component.setProps({ deleteUrl: "/test/delete/url" });

    moxios.stubRequest("/test/delete/url", { status: 500 });

    const button = component.find(".delete-btn");
    button.trigger("click");

    moxios.wait(() => {
      const event = component.emitted()["deletion-failed"];
      assert.exists(event);
      done();
    });
  });

  function selectFile(file_data) {
    let takeFileStub = sinon.stub().returns(file_data);
    component.setMethods({ takeFile: takeFileStub });

    let file_input = component.find("input[type=file]");
    file_input.trigger("change");
  }
});
